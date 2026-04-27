import type { Logger } from "pino";

import {
  applyResultCopy,
  EvidenceProviderError,
  type ClaimAnalysisInput,
  type EvidenceProvider,
  type ResultCopy,
  type SourceAssessment,
  type SourceForAssessment,
} from "./evidenceProvider";
import { ProgressEventBus } from "./events";
import { ChecksRepository, makeProgressEvent } from "./repository";
import {
  canonicalHttpUrl,
  defaultSourceFetchOptions,
  fetchAndExtractSource,
  assertSafeUrl,
  SourceFetchError,
  type SourceFetchOptions,
} from "./sourceSafety";
import {
  dedupeDiscoveredSources,
  isSnippetOnlySource,
  rankCandidateRecords,
  rankDiscoveredSources,
  selectBestEvidenceByDomain,
} from "./sourceRanking";
import { buildEvidenceResult, makeCheckError } from "./synthesis";
import type {
  CheckApiErrorDto,
  CheckInputDto,
  CheckResultDto,
  ClaimAnalysisDto,
  InputExtractionRecordDto,
  ProgressEventDto,
  SourceExtractionRecordDto,
} from "./types";

export interface EvidencePipelineOptions {
  logger: Logger;
  evidenceProvider: EvidenceProvider;
  sourceFetchOptions?: SourceFetchOptions;
  maxCandidateSources: number;
  maxEvidenceSources: number;
  delayMs?: number;
}

interface PreparedClaim {
  claimAnalysis: ClaimAnalysisDto;
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
    const input = record.input ?? { type: "text", content: "" };

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

      const prepared = await this.prepareClaim(checkId, input);

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

      const candidates = await this.callProvider(
        checkId,
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

      const verifiedSources = await this.verifyAndExtractSources(
        rankCandidateRecords(sourceRecords),
      );
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

      const assessments = await this.callProvider(
        checkId,
        "source_assessment",
        {
          mainClaim: prepared.claimAnalysis.mainClaim,
          sources: evidenceSources.map(sourceToAssessmentInput),
        },
        () =>
          this.evidenceProvider.assessSources(
            prepared.claimAnalysis.mainClaim,
            evidenceSources.map(sourceToAssessmentInput),
          ),
      );
      this.persistSourceEvaluations(checkId, evidenceSources, assessments);
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
      const result = await this.withResultCopy(
        checkId,
        prepared.claimAnalysis.mainClaim,
        deterministicResult,
      );
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

  private async prepareClaim(checkId: string, input: CheckInputDto): Promise<PreparedClaim> {
    const claimInput = await this.buildClaimAnalysisInput(checkId, input);
    const analysis = await this.callProvider(checkId, "claim_analysis", claimInput, () =>
      this.evidenceProvider.analyzeClaim(claimInput),
    );
    const now = new Date().toISOString();
    const claimAnalysis = this.repository.saveClaimAnalysis({
      checkId,
      ...analysis,
      createdAt: now,
      updatedAt: now,
    });

    return { claimAnalysis };
  }

  private async buildClaimAnalysisInput(
    checkId: string,
    input: CheckInputDto,
  ): Promise<ClaimAnalysisInput> {
    if (input.type !== "url") {
      return {
        input,
        extractedTitle: null,
        extractedTextExcerpt: null,
      };
    }

    const extraction = await this.extractInputUrl(checkId, input.content);
    return {
      input,
      extractedTitle: extraction.title,
      extractedTextExcerpt: extraction.textExcerpt,
    };
  }

  private async extractInputUrl(
    checkId: string,
    inputUrl: string,
  ): Promise<InputExtractionRecordDto> {
    const createdAt = new Date().toISOString();
    const record = this.repository.createInputExtraction({ checkId, inputUrl, createdAt });

    try {
      const fetched = await fetchAndExtractSource(inputUrl, this.sourceFetchOptions);
      const updated = this.repository.updateInputExtraction(record.id, {
        resolvedUrl: fetched.resolvedUrl,
        domain: fetched.domain,
        title: fetched.title,
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
      if (!updated) {
        throw new PipelineCheckError(
          "INPUT_EXTRACTION_FAILED",
          "input extraction",
          "The submitted URL could not be stored after extraction.",
        );
      }
      return updated;
    } catch (error) {
      const sourceError = normalizeSourceError(error);
      this.repository.updateInputExtraction(record.id, {
        verificationStatus: sourceError.blocked ? "blocked" : "extraction_failed",
        failureCode: sourceError.code,
        failureMessage: sourceError.message,
        updatedAt: new Date().toISOString(),
      });
      throw new PipelineCheckError(
        "INPUT_EXTRACTION_FAILED",
        "input extraction",
        `The submitted URL could not be safely fetched and extracted: ${sourceError.message}`,
        !sourceError.blocked,
      );
    }
  }

  private async verifyAndExtractSources(
    sourceRecords: readonly SourceExtractionRecordDto[],
  ): Promise<SourceExtractionRecordDto[]> {
    const verifiedSources: SourceExtractionRecordDto[] = [];

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
        if (updated) verifiedSources.push(updated);
      } catch (error) {
        const sourceError = normalizeSourceError(error);
        const snippetSource = sourceError.blocked
          ? null
          : await this.tryCreateSnippetOnlySource(source, sourceError);
        if (snippetSource) {
          verifiedSources.push(snippetSource);
          continue;
        }

        this.repository.updateSourceExtraction(source.id, {
          verificationStatus: sourceError.blocked ? "blocked" : "extraction_failed",
          failureCode: sourceError.code,
          failureMessage: sourceError.message,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    return verifiedSources;
  }

  private async tryCreateSnippetOnlySource(
    source: SourceExtractionRecordDto,
    sourceError: { code: string; message: string },
  ): Promise<SourceExtractionRecordDto | null> {
    const snippet = normalizeSnippet(source.discoverySnippet);
    if (!snippet) return null;

    try {
      await assertSafeUrl(source.candidateUrl, this.sourceFetchOptions.resolveHostname);
      const resolvedUrl = canonicalHttpUrl(source.candidateUrl);
      return this.repository.updateSourceExtraction(source.id, {
        resolvedUrl,
        domain: new URL(resolvedUrl).hostname,
        title: source.title,
        verificationStatus: "snippet_only",
        httpStatus: null,
        contentType: null,
        contentHash: null,
        extractionMethod: "snippet_only",
        extractedText: null,
        textExcerpt: snippet,
        failureCode: sourceError.code,
        failureMessage: sourceError.message,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      const snippetError = normalizeSourceError(error);
      this.repository.updateSourceExtraction(source.id, {
        verificationStatus: snippetError.blocked ? "blocked" : "extraction_failed",
        failureCode: snippetError.code,
        failureMessage: snippetError.message,
        updatedAt: new Date().toISOString(),
      });
      return null;
    }
  }

  private persistSourceEvaluations(
    checkId: string,
    sources: readonly SourceExtractionRecordDto[],
    assessments: readonly SourceAssessment[],
  ): void {
    const sourcesByUrl = new Map(
      sources.map((source) => [normalizeUrl(source.resolvedUrl ?? source.candidateUrl), source]),
    );
    const seenSources = new Set<string>();

    for (const assessment of assessments) {
      const source = sourcesByUrl.get(normalizeUrl(assessment.sourceUrl));
      if (!source || seenSources.has(source.id)) continue;
      seenSources.add(source.id);
      this.repository.createSourceEvaluation({
        checkId,
        sourceExtractionId: source.id,
        sourceUrl: source.resolvedUrl ?? source.candidateUrl,
        provider: this.evidenceProvider.metadata.provider,
        model: this.evidenceProvider.metadata.model,
        relation: assessment.relation,
        scopeMatch: clamp01(assessment.scopeMatch),
        credibilityLabel: assessment.credibilityLabel,
        isPrimary: assessment.isPrimary,
        rationale: assessment.rationale,
        evidenceText: assessment.evidenceText,
        createdAt: new Date().toISOString(),
      });
    }
  }

  private async withResultCopy(
    checkId: string,
    mainClaim: string,
    result: CheckResultDto,
  ): Promise<CheckResultDto> {
    try {
      const copy = await this.callProvider<ResultCopy>(
        checkId,
        "result_copy",
        {
          mainClaim,
          verdictBand: result.verdictBand,
          evidence: result.evidence,
          uncertaintyLines: result.uncertaintyLines,
        },
        () =>
          this.evidenceProvider.writeResultCopy({
            mainClaim,
            verdictBand: result.verdictBand,
            evidence: result.evidence,
            uncertaintyLines: result.uncertaintyLines,
          }),
      );
      return applyResultCopy(result, copy);
    } catch (error) {
      this.logger.warn({ error, checkId }, "Result copy provider failed; using deterministic copy");
      return result;
    }
  }

  private async callProvider<T>(
    checkId: string,
    operation: string,
    requestJson: unknown,
    execute: () => Promise<T>,
  ): Promise<T> {
    const providerCall = this.repository.createProviderCall({
      checkId,
      operation,
      provider:
        operation === "source_discovery"
          ? this.evidenceProvider.metadata.discoveryProvider
          : this.evidenceProvider.metadata.provider,
      model: this.evidenceProvider.metadata.model,
      requestJson: compactJson(requestJson),
      createdAt: new Date().toISOString(),
    });

    try {
      const response = await execute();
      this.repository.updateProviderCall(providerCall.id, {
        status: "succeeded",
        responseJson: compactJson(response),
        errorCode: null,
        errorMessage: null,
        completedAt: new Date().toISOString(),
      });
      return response;
    } catch (error) {
      this.repository.updateProviderCall(providerCall.id, {
        status: "failed",
        errorCode: errorCode(error),
        errorMessage: errorMessage(error, "Provider call failed."),
        completedAt: new Date().toISOString(),
      });
      throw error;
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

class PipelineCheckError extends Error {
  constructor(
    readonly code: string,
    readonly category: string,
    message: string,
    readonly retryable = true,
  ) {
    super(message);
    this.name = "PipelineCheckError";
  }
}

function sourceToAssessmentInput(source: SourceExtractionRecordDto): SourceForAssessment {
  return {
    resolvedUrl: source.resolvedUrl ?? source.candidateUrl,
    domain: source.domain ?? new URL(source.resolvedUrl ?? source.candidateUrl).hostname,
    title: source.title,
    textExcerpt: source.textExcerpt ?? "",
    extractionMethod: source.extractionMethod,
    isSnippetOnly: isSnippetOnlySource(source),
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
      blocked:
        error.code.includes("UNSAFE") ||
        error.code.includes("PROTOCOL") ||
        error.code === "INVALID_URL" ||
        error.code.startsWith("DNS_"),
    };
  }

  return {
    code: "SOURCE_FETCH_FAILED",
    message: error instanceof Error ? error.message : "Source fetch failed.",
    blocked: false,
  };
}

function errorToCheckError(error: unknown): CheckApiErrorDto {
  if (error instanceof PipelineCheckError) {
    return makeCheckError({
      code: error.code,
      category: error.category,
      message: error.message,
      retryable: error.retryable,
    });
  }

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

function normalizeSnippet(value: string | null): string | null {
  const snippet = value?.replace(/\s+/g, " ").trim();
  if (!snippet || snippet.length < 20) return null;
  return snippet.length <= 1_200 ? snippet : `${snippet.slice(0, 1_199)}…`;
}

function normalizeUrl(value: string): string {
  try {
    const url = new URL(value);
    url.hash = "";
    return url.toString();
  } catch {
    return value;
  }
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function compactJson(value: unknown, depth = 0): unknown {
  if (depth > 5) return "[truncated]";
  if (typeof value === "string") return value.length <= 4_000 ? value : `${value.slice(0, 4_000)}…`;
  if (typeof value !== "object" || value === null) return value;
  if (Array.isArray(value)) return value.slice(0, 25).map((item) => compactJson(item, depth + 1));

  const compacted: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value)) {
    compacted[key] = compactJson(child, depth + 1);
  }
  return compacted;
}

function errorCode(error: unknown): string {
  if (error instanceof EvidenceProviderError) return error.code;
  if (error instanceof PipelineCheckError) return error.code;
  if (error instanceof SourceFetchError) return error.code;
  return "PROVIDER_ERROR";
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function sleep(delayMs: number): Promise<void> {
  if (delayMs <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}
