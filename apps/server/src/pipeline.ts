import type { Logger } from "pino";

import {
  EvidenceProviderError,
  type EvidenceProvider,
  type SourceForAssessment,
} from "./evidenceProvider";
import { ProgressEventBus } from "./events";
import { ChecksRepository, makeProgressEvent } from "./repository";
import {
  defaultSourceFetchOptions,
  fetchAndExtractSource,
  SourceFetchError,
  type SourceFetchOptions,
} from "./sourceSafety";
import { buildEvidenceResult, makeCheckError } from "./synthesis";
import type { CheckApiErrorDto, ProgressEventDto, SourceExtractionRecordDto } from "./types";

export interface EvidencePipelineOptions {
  logger: Logger;
  evidenceProvider: EvidenceProvider;
  sourceFetchOptions?: SourceFetchOptions;
  maxCandidateSources: number;
  maxEvidenceSources: number;
  delayMs?: number;
}

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

    try {
      await this.recordAndPublish(
        makeProgressEvent({
          checkId,
          seq: 2,
          phase: "strategy",
          percent: 18,
          message: "Planning evidence discovery.",
          stepCode: "strategy",
          provider: "openai",
        }),
      );

      await this.recordAndPublish(
        makeProgressEvent({
          checkId,
          seq: 3,
          phase: "discovery",
          percent: 35,
          message: "Searching for candidate source URLs.",
          stepCode: "source_discovery",
          provider: "openai:web_search",
        }),
      );

      const candidates = await this.evidenceProvider.discoverSources(
        record.input ?? { type: "text", content: "" },
        this.maxCandidateSources,
      );
      if (candidates.length === 0) {
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
      const sourceRecords = candidates.map((candidate, index) =>
        this.repository.createSourceExtraction({
          checkId,
          candidateUrl: candidate.url,
          title: candidate.title,
          discoveryProvider: "openai:web_search",
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

      const fetchedSources = await this.verifyAndExtractSources(sourceRecords);
      if (fetchedSources.length === 0) {
        this.failCheck(
          checkId,
          5,
          makeCheckError({
            code: "SOURCE_EXTRACTION_FAILED",
            category: "source extraction",
            message: "No discovered source could be safely fetched and extracted.",
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
          provider: "openai",
        }),
      );

      const assessments = await this.evidenceProvider.assessSources(
        record.input?.content ?? "",
        fetchedSources.map(sourceToAssessmentInput).slice(0, this.maxEvidenceSources),
      );

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
      const result = buildEvidenceResult({
        record: latestRecord,
        extractions: this.repository.listSourceExtractions(checkId),
        assessments,
        completedAt,
        maxEvidenceSources: this.maxEvidenceSources,
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

  private async verifyAndExtractSources(
    sourceRecords: readonly SourceExtractionRecordDto[],
  ): Promise<SourceExtractionRecordDto[]> {
    const fetchedSources: SourceExtractionRecordDto[] = [];

    for (const source of sourceRecords.slice(0, this.maxCandidateSources)) {
      try {
        const fetched = await fetchAndExtractSource(source.candidateUrl, this.sourceFetchOptions);
        const updated = this.repository.updateSourceExtraction(source.id, {
          resolvedUrl: fetched.resolvedUrl,
          domain: fetched.domain,
          title: source.title ?? fetched.title,
          verificationStatus: "fetched",
          httpStatus: fetched.httpStatus,
          contentType: fetched.contentType,
          contentHash: fetched.contentHash,
          extractionMethod: fetched.extractionMethod,
          extractedText: fetched.extractedText,
          textExcerpt: fetched.textExcerpt,
          failureCode: null,
          failureMessage: null,
          updatedAt: new Date().toISOString(),
        });
        if (updated) fetchedSources.push(updated);
        if (fetchedSources.length >= this.maxEvidenceSources) break;
      } catch (error) {
        const sourceError = normalizeSourceError(error);
        this.repository.updateSourceExtraction(source.id, {
          verificationStatus: sourceError.blocked ? "blocked" : "extraction_failed",
          failureCode: sourceError.code,
          failureMessage: sourceError.message,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    return fetchedSources;
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

function sourceToAssessmentInput(source: SourceExtractionRecordDto): SourceForAssessment {
  return {
    resolvedUrl: source.resolvedUrl ?? source.candidateUrl,
    domain: source.domain ?? new URL(source.resolvedUrl ?? source.candidateUrl).hostname,
    title: source.title,
    textExcerpt: source.textExcerpt ?? "",
  };
}

function nextFailureSeq(checkId: string, repository: ChecksRepository): number {
  const record = repository.getCheck(checkId);
  if (!record) return 7;
  return Math.min(7, record.progress.eventSeq + 1);
}

function normalizeSourceError(error: unknown): { code: string; message: string; blocked: boolean } {
  if (error instanceof SourceFetchError) {
    return {
      code: error.code,
      message: error.message,
      blocked: error.code.includes("UNSAFE") || error.code.includes("PROTOCOL"),
    };
  }

  return {
    code: "SOURCE_FETCH_FAILED",
    message: error instanceof Error ? error.message : "Source fetch failed.",
    blocked: false,
  };
}

function errorToCheckError(error: unknown): CheckApiErrorDto {
  if (error instanceof EvidenceProviderError) {
    return makeCheckError({
      code: error.code,
      category:
        error.code === "PROVIDER_CONFIGURATION_ERROR" ? "provider configuration" : "provider",
      message: error.message,
      retryable: error.code !== "PROVIDER_CONFIGURATION_ERROR",
    });
  }

  return makeCheckError({
    code: "PIPELINE_ERROR",
    category: "pipeline",
    message: error instanceof Error ? error.message : "The evidence pipeline failed.",
  });
}

function sleep(delayMs: number): Promise<void> {
  if (delayMs <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}
