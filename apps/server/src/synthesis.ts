import type {
  CheckApiErrorDto,
  CheckRecordDto,
  CheckResultDto,
  EvidenceItemDto,
  SourceExtractionRecordDto,
  VerdictBand,
} from "./types";
import type { SourceAssessment } from "./evidenceProvider";

export function makeCheckError(input: {
  code: string;
  category: string;
  message: string;
  retryable?: boolean;
  traceId?: string | null;
  occurredAt?: string;
}): CheckApiErrorDto {
  return {
    code: input.code,
    category: input.category,
    message: input.message,
    retryable: input.retryable ?? true,
    traceId: input.traceId ?? null,
    occurredAt: input.occurredAt ?? new Date().toISOString(),
  };
}

export function buildEvidenceResult(input: {
  record: CheckRecordDto;
  extractions: readonly SourceExtractionRecordDto[];
  assessments: readonly SourceAssessment[];
  completedAt: string;
  maxEvidenceSources: number;
}): CheckResultDto {
  const evidence = buildEvidenceItems(input.extractions, input.assessments).slice(
    0,
    input.maxEvidenceSources,
  );
  const directEvidence = evidence.filter(
    (item) => item.relation === "supports" || item.relation === "contradicts",
  );
  const supports = evidence.filter((item) => item.relation === "supports").length;
  const contradicts = evidence.filter((item) => item.relation === "contradicts").length;
  const primary = evidence.filter((item) => item.tier === 1).length;
  const independent = new Set(evidence.map((item) => item.domain)).size;
  const directIndependent = new Set(directEvidence.map((item) => item.domain)).size;
  const avgDirectScope = average(directEvidence.map((item) => item.scopeMatch));
  const verdictBand = chooseVerdictBand({
    evidenceCount: evidence.length,
    directCount: directEvidence.length,
    directIndependent,
    avgDirectScope,
    supports,
    contradicts,
  });

  return {
    checkId: input.record.checkId,
    inputText: input.record.input?.content ?? "",
    inputTypeLabel: input.record.input?.type === "url" ? "URL input" : "text input",
    durationLabel: durationLabel(input.record.createdAt, input.completedAt),
    verdictBand,
    verdictLabel: verdictLabel(verdictBand),
    headline: headline(verdictBand),
    description: description(verdictBand, supports, contradicts, evidence.length),
    atAGlance: {
      evidence: evidence.length,
      independent,
      fullText: evidence.length,
      primary,
      snippet: 0,
      uncertainty:
        verdictBand === "evidence_strong"
          ? "low"
          : verdictBand === "needs_context"
            ? "high"
            : "med",
    },
    cues: [
      {
        name: "Verified sources",
        text: `${String(evidence.length)} fetched source${evidence.length === 1 ? "" : "s"}`,
        note: "Sources passed backend URL safety checks and text extraction before evaluation.",
        strength: Math.min(5, evidence.length),
        tooltip: "Only backend-verified http(s) URLs can appear as evidence.",
      },
      {
        name: "Independence",
        text: `${String(independent)} independent domain${independent === 1 ? "" : "s"}`,
        note: "Same-domain sources are weighted lower in this first slice.",
        strength: Math.min(5, independent),
        tooltip: "Domain-level independence is a simple MVP proxy for source independence.",
      },
    ],
    evidence,
    uncertaintyLines: uncertaintyLines(verdictBand, evidence.length),
    noteText:
      "This result is based on verified fetched sources and model-assisted source assessment. The final band is selected by backend rules.",
    summaryText: summaryText(verdictBand, supports, contradicts, evidence.length),
  };
}

function buildEvidenceItems(
  extractions: readonly SourceExtractionRecordDto[],
  assessments: readonly SourceAssessment[],
): EvidenceItemDto[] {
  const assessmentsByUrl = new Map(
    assessments.map((assessment) => [normalizeUrl(assessment.sourceUrl), assessment]),
  );
  const seenDomains = new Set<string>();

  return extractions
    .filter(
      (extraction) =>
        extraction.verificationStatus === "fetched" &&
        extraction.resolvedUrl &&
        extraction.domain &&
        extraction.textExcerpt,
    )
    .map((extraction): EvidenceItemDto => {
      const resolvedUrl = extraction.resolvedUrl ?? extraction.candidateUrl;
      const domain = extraction.domain ?? new URL(resolvedUrl).hostname;
      const assessment = assessmentsByUrl.get(normalizeUrl(resolvedUrl));
      const isDuplicateDomain = seenDomains.has(domain);
      seenDomains.add(domain);
      const relation = assessment?.relation ?? "neutral";
      const isPrimary = assessment?.isPrimary ?? false;
      const tier = isPrimary && !isDuplicateDomain ? 1 : isDuplicateDomain ? 3 : 2;
      const text =
        assessment?.evidenceText || extraction.textExcerpt || "Verified source text extracted.";

      return {
        sourceName: domain,
        domain,
        credibilityLabel: assessment?.credibilityLabel || "Verified source",
        date: `accessed ${extraction.updatedAt.slice(0, 10)}`,
        title: extraction.title || domain,
        text: truncate(text, 520),
        url: resolvedUrl,
        relation,
        tier,
        scopeMatch: clamp01(assessment?.scopeMatch ?? 0.25),
        ...(isDuplicateDomain ? { clusterId: `domain:${domain}` } : {}),
      };
    });
}

function chooseVerdictBand(input: {
  evidenceCount: number;
  directCount: number;
  directIndependent: number;
  avgDirectScope: number;
  supports: number;
  contradicts: number;
}): VerdictBand {
  if (input.evidenceCount === 0) return "needs_context";
  if (input.directCount === 0) return "needs_context";
  if (input.supports > 0 && input.contradicts > 0) return "evidence_mixed";
  if (input.directCount >= 2 && input.directIndependent >= 2 && input.avgDirectScope >= 0.65) {
    return "evidence_strong";
  }
  if (input.directCount >= 2 || input.avgDirectScope >= 0.5) return "evidence_weak";
  return "evidence_thin";
}

function verdictLabel(verdictBand: VerdictBand): string {
  switch (verdictBand) {
    case "evidence_strong":
      return "evidence strong";
    case "evidence_mixed":
      return "evidence mixed";
    case "evidence_weak":
      return "evidence weak";
    case "evidence_thin":
      return "evidence thin";
    case "system_failed":
      return "system failed";
    case "needs_context":
      return "needs context";
  }
}

function headline(verdictBand: VerdictBand): string {
  switch (verdictBand) {
    case "evidence_strong":
      return "Verified sources give this check a stronger evidence base.";
    case "evidence_mixed":
      return "Verified sources point in more than one direction.";
    case "evidence_weak":
      return "Some verified evidence is relevant, but it is not decisive.";
    case "evidence_thin":
      return "Only thin verified evidence was found for this claim.";
    case "system_failed":
      return "The evidence pipeline could not complete.";
    case "needs_context":
      return "The sources found do not give enough direct context.";
  }
}

function description(
  verdictBand: VerdictBand,
  supports: number,
  contradicts: number,
  evidenceCount: number,
): string {
  if (verdictBand === "needs_context") {
    return "TrustTrace fetched sources, but they did not directly resolve the submitted claim.";
  }
  return `TrustTrace verified ${String(evidenceCount)} fetched source${evidenceCount === 1 ? "" : "s"}: ${String(supports)} supporting, ${String(contradicts)} contradicting, and ${String(evidenceCount - supports - contradicts)} neutral.`;
}

function uncertaintyLines(verdictBand: VerdictBand, evidenceCount: number): string[] {
  if (verdictBand === "needs_context") {
    return [
      "The fetched sources may be background context rather than direct evidence.",
      "A deeper check should broaden source discovery and look for primary documents.",
    ];
  }

  return [
    `${String(evidenceCount)} source${evidenceCount === 1 ? " was" : "s were"} fetched and evaluated in this first evidence-discovery slice.`,
    "Source independence is currently approximated by domain, so shared-origin reporting may still be overcounted.",
  ];
}

function summaryText(
  verdictBand: VerdictBand,
  supports: number,
  contradicts: number,
  evidenceCount: number,
): string {
  if (verdictBand === "needs_context") {
    return "Verified source discovery completed, but the fetched sources did not directly settle the claim.";
  }
  return `Verified source discovery completed with ${String(evidenceCount)} evidence item${evidenceCount === 1 ? "" : "s"}, including ${String(supports)} support relation${supports === 1 ? "" : "s"} and ${String(contradicts)} contradiction relation${contradicts === 1 ? "" : "s"}.`;
}

function durationLabel(startedAt: string, completedAt: string): string {
  const durationMs = Date.parse(completedAt) - Date.parse(startedAt);
  if (!Number.isFinite(durationMs) || durationMs < 0) return "measured by server";
  return `${(durationMs / 1000).toFixed(1)}s`;
}

function average(values: readonly number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
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

function truncate(value: string, maxLength: number): string {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 1)}…`;
}
