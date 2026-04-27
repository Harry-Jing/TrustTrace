import type { SourceEvaluationRecordDto } from "../types/audit";
import type { EvidenceItemDto } from "../types/results";
import type { SourceExtractionRecordDto } from "../types/sources";

export type AssessmentLike = Pick<
  SourceEvaluationRecordDto,
  "sourceUrl" | "relation" | "scopeMatch" | "credibilityLabel" | "isPrimary" | "evidenceText"
>;

export function buildEvidenceItems(
  extractions: readonly SourceExtractionRecordDto[],
  assessments: readonly AssessmentLike[],
): EvidenceItemDto[] {
  const assessmentsByUrl = new Map(
    assessments.map((assessment) => [normalizeUrl(assessment.sourceUrl), assessment]),
  );
  const seenDomains = new Set<string>();

  return extractions
    .filter(
      (extraction) =>
        (extraction.verificationStatus === "fetched" ||
          extraction.verificationStatus === "snippet_only") &&
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
      const isSnippetOnly = isSnippetOnlyExtraction(extraction);
      const tier = isSnippetOnly
        ? 4
        : isPrimary && !isDuplicateDomain
          ? 1
          : isDuplicateDomain
            ? 3
            : 2;
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
        scopeMatch: isSnippetOnly
          ? Math.min(0.45, clamp01(assessment?.scopeMatch ?? 0.2))
          : clamp01(assessment?.scopeMatch ?? 0.25),
        ...(isDuplicateDomain ? { clusterId: `domain:${domain}` } : {}),
      };
    })
    .sort(compareEvidenceItems);
}

function compareEvidenceItems(left: EvidenceItemDto, right: EvidenceItemDto): number {
  const relationDelta = relationRank(right.relation) - relationRank(left.relation);
  if (relationDelta !== 0) return relationDelta;
  const tierDelta = left.tier - right.tier;
  if (tierDelta !== 0) return tierDelta;
  return right.scopeMatch - left.scopeMatch;
}

function relationRank(relation: EvidenceItemDto["relation"]): number {
  return relation === "supports" || relation === "contradicts" ? 1 : 0;
}

function isSnippetOnlyExtraction(extraction: SourceExtractionRecordDto): boolean {
  return (
    extraction.verificationStatus === "snippet_only" ||
    extraction.extractionMethod === "snippet_only"
  );
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
