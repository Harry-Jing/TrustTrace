import type { SourceAssessment } from "../evidenceProvider/types";
import type { ChecksRepository } from "../repositories/repositoryFacade";
import type { SourceExtractionRecordDto } from "../types/sources";

export function persistSourceEvaluations(input: {
  checkId: string;
  repository: ChecksRepository;
  provider: string;
  model: string;
  sources: readonly SourceExtractionRecordDto[];
  assessments: readonly SourceAssessment[];
}): void {
  const sourcesByUrl = new Map(
    input.sources.map((source) => [
      normalizeUrl(source.resolvedUrl ?? source.candidateUrl),
      source,
    ]),
  );
  const seenSources = new Set<string>();

  for (const assessment of input.assessments) {
    const source = sourcesByUrl.get(normalizeUrl(assessment.sourceUrl));
    if (!source || seenSources.has(source.id)) continue;
    seenSources.add(source.id);
    input.repository.createSourceEvaluation({
      checkId: input.checkId,
      sourceExtractionId: source.id,
      sourceUrl: source.resolvedUrl ?? source.candidateUrl,
      provider: input.provider,
      model: input.model,
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
