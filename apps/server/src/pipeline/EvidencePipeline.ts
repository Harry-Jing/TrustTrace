import type { Logger } from "pino";

import type { EvidenceProvider } from "../evidenceProvider/types";
import { ProgressEventBus } from "../events";
import { makeProgressEvent } from "../repositories/mappers/progressMapper";
import { ChecksRepository } from "../repositories/repositoryFacade";
import { defaultSourceFetchOptions } from "../sourceSafety/defaults";
import type { SourceFetchOptions } from "../sourceSafety/types";
import {
  dedupeDiscoveredSources,
  rankCandidateRecords,
  rankDiscoveredSources,
  selectBestEvidenceByDomain,
} from "../sources/ranking";
import { buildEvidenceResult } from "../synthesis/buildEvidenceResult";
import { makeCheckError } from "../synthesis/errors";
import type { CheckApiErrorDto, ProgressEventDto } from "../types/checks";
import { prepareClaim } from "./claimPreparation";
import { errorToCheckError, nextFailureSeq } from "./errors";
import { callProvider as recordProviderCall } from "./providerCalls";
import { withResultCopy } from "./resultCopy";
import { persistSourceEvaluations } from "./sourceEvaluations";
import { sourceToAssessmentInput, verifyAndExtractSources } from "./sourceVerification";
import type { EvidencePipelineOptions } from "./types";
import { sleep } from "./utils";

export class EvidencePipeline {
  private readonly delayMs: number;
  private readonly logger: Logger;
  private readonly evidenceProvider: EvidenceProvider;
  private readonly sourceFetchOptions: SourceFetchOptions;
  private readonly maxCandidateSources: number;
  private readonly maxEvidenceSources: number;
  private readonly activeRuns = new Set<Promise<void>>();

  constructor(
    private readonly repository: ChecksRepository,
    private readonly events: ProgressEventBus,
    options: EvidencePipelineOptions,
  ) {
    this.delayMs = options.delayMs ?? 0;
    this.logger = options.logger;
    this.evidenceProvider = options.evidenceProvider;
    this.sourceFetchOptions = options.sourceFetchOptions ?? defaultSourceFetchOptions();
    this.maxCandidateSources = options.maxCandidateSources;
    this.maxEvidenceSources = options.maxEvidenceSources;
  }

  start(checkId: string): void {
    const runPromise = this.run(checkId).catch((error: unknown) => {
      this.logger.error({ error, checkId }, "Evidence pipeline failed unexpectedly");
      this.failFromError(checkId, 7, error);
    });
    this.activeRuns.add(runPromise);
    void runPromise.finally(() => {
      this.activeRuns.delete(runPromise);
    });
  }

  async waitForIdle(): Promise<void> {
    await Promise.all([...this.activeRuns]);
  }

  private async run(checkId: string): Promise<void> {
    const record = this.repository.getCheck(checkId);
    if (!record || record.status !== "running") return;
    const input = record.input ?? { type: "text", content: "" };
    const callProviderForCheck = <T>(
      operation: string,
      requestJson: unknown,
      execute: () => Promise<T>,
    ) =>
      recordProviderCall(
        this.repository,
        this.evidenceProvider,
        checkId,
        operation,
        requestJson,
        execute,
      );

    try {
      await this.recordAndPublish(
        makeProgressEvent({
          checkId,
          seq: 2,
          phase: "strategy",
          percent: 18,
          message: "Preparing the main claim and source strategy.",
          stepCode: "claim_analysis",
          provider: this.evidenceProvider.metadata.provider,
        }),
      );

      const prepared = await prepareClaim({
        checkId,
        checkInput: input,
        repository: this.repository,
        evidenceProvider: this.evidenceProvider,
        sourceFetchOptions: this.sourceFetchOptions,
        callProvider: callProviderForCheck,
      });

      await this.recordAndPublish(
        makeProgressEvent({
          checkId,
          seq: 3,
          phase: "discovery",
          percent: 35,
          message: "Searching for candidate source URLs.",
          stepCode: "source_discovery",
          provider: this.evidenceProvider.metadata.discoveryProvider,
        }),
      );

      const candidates = await callProviderForCheck(
        "source_discovery",
        {
          mainClaim: prepared.claimAnalysis.mainClaim,
          queryPlan: prepared.claimAnalysis.queryPlan,
          maxCandidates: this.maxCandidateSources,
        },
        () =>
          this.evidenceProvider.discoverSources(
            {
              originalInput: input,
              claimAnalysis: prepared.claimAnalysis,
            },
            this.maxCandidateSources,
          ),
      );
      const rankedCandidates = rankDiscoveredSources(dedupeDiscoveredSources(candidates)).slice(
        0,
        this.maxCandidateSources,
      );
      if (rankedCandidates.length === 0) {
        this.failCheck(
          checkId,
          4,
          makeCheckError({
            code: "SOURCE_DISCOVERY_FAILED",
            category: "source discovery",
            message: "OpenAI did not return candidate source URLs for this check.",
          }),
        );
        return;
      }

      const createdAt = new Date().toISOString();
      const sourceRecords = rankedCandidates.map((candidate, index) =>
        this.repository.createSourceExtraction({
          checkId,
          candidateUrl: candidate.url,
          title: candidate.title,
          discoverySnippet: candidate.snippet ?? null,
          discoveryProvider: this.evidenceProvider.metadata.discoveryProvider,
          discoveryRank: index + 1,
          createdAt,
        }),
      );

      await this.recordAndPublish(
        makeProgressEvent({
          checkId,
          seq: 4,
          phase: "verify_read",
          percent: 58,
          message: "Verifying URLs and extracting source text.",
          stepCode: "verify_read",
        }),
      );

      const verifiedSources = await verifyAndExtractSources({
        repository: this.repository,
        sourceRecords: rankCandidateRecords(sourceRecords),
        sourceFetchOptions: this.sourceFetchOptions,
        maxCandidateSources: this.maxCandidateSources,
      });
      const evidenceSources = selectBestEvidenceByDomain(verifiedSources, this.maxEvidenceSources);
      if (evidenceSources.length === 0) {
        this.failCheck(
          checkId,
          5,
          makeCheckError({
            code: "SOURCE_EXTRACTION_FAILED",
            category: "source extraction",
            message:
              "No discovered source could be safely fetched, extracted, or verified as snippet context.",
          }),
        );
        return;
      }

      await this.recordAndPublish(
        makeProgressEvent({
          checkId,
          seq: 5,
          phase: "weigh",
          percent: 76,
          message: "Assessing verified source excerpts.",
          stepCode: "source_assessment",
          provider: this.evidenceProvider.metadata.provider,
        }),
      );

      const assessmentInputs = evidenceSources.map(sourceToAssessmentInput);
      const assessments = await callProviderForCheck(
        "source_assessment",
        {
          mainClaim: prepared.claimAnalysis.mainClaim,
          sources: assessmentInputs,
        },
        () =>
          this.evidenceProvider.assessSources(prepared.claimAnalysis.mainClaim, assessmentInputs),
      );
      persistSourceEvaluations({
        checkId,
        repository: this.repository,
        provider: this.evidenceProvider.metadata.provider,
        model: this.evidenceProvider.metadata.model,
        sources: evidenceSources,
        assessments,
      });
      const evaluations = this.repository.listSourceEvaluations(checkId);

      await this.recordAndPublish(
        makeProgressEvent({
          checkId,
          seq: 6,
          phase: "verdict",
          percent: 90,
          message: "Synthesizing the evidence band.",
          stepCode: "deterministic_synthesis",
        }),
      );

      const completedAt = new Date().toISOString();
      const latestRecord = this.repository.getCheck(checkId) ?? record;
      const deterministicResult = buildEvidenceResult({
        record: latestRecord,
        extractions: evidenceSources,
        assessments: evaluations,
        completedAt,
        maxEvidenceSources: this.maxEvidenceSources,
      });
      const result = await withResultCopy({
        checkId,
        mainClaim: prepared.claimAnalysis.mainClaim,
        result: deterministicResult,
        evidenceProvider: this.evidenceProvider,
        repository: this.repository,
        logger: this.logger,
        callProvider: callProviderForCheck,
      });
      const completedEvent = makeProgressEvent({
        checkId,
        seq: 7,
        phase: "completed",
        status: "completed",
        percent: 100,
        message: "Check complete.",
        stepCode: "completed",
        createdAt: completedAt,
      });

      this.repository.completeCheckWithEvent(completedEvent, result);
      this.events.publish(completedEvent);
    } catch (error) {
      this.logger.error({ error, checkId }, "Evidence pipeline run failed");
      this.failFromError(checkId, nextFailureSeq(checkId, this.repository), error);
    }
  }

  private async recordAndPublish(event: ProgressEventDto): Promise<void> {
    await sleep(this.delayMs);
    const record = this.repository.getCheck(event.checkId);
    if (!record || record.status !== "running") return;
    this.repository.recordProgressEvent(event);
    this.events.publish(event);
  }

  private failFromError(checkId: string, seq: number, error: unknown): void {
    const record = this.repository.getCheck(checkId);
    if (!record || record.status !== "running") return;

    this.failCheck(checkId, seq, errorToCheckError(error));
  }

  private failCheck(checkId: string, seq: number, error: CheckApiErrorDto): void {
    const event = makeProgressEvent({
      checkId,
      seq,
      phase: "failed",
      status: "failed",
      percent: 100,
      message: error.message,
      stepCode: error.code,
      error,
      createdAt: error.occurredAt,
    });
    this.repository.failCheckWithEvent(event, error);
    this.events.publish(event);
  }
}
