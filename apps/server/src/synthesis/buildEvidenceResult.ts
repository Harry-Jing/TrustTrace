import type { CheckRecordDto } from "../types/checks";
import type { CheckResultDto } from "../types/results";
import type { SourceExtractionRecordDto } from "../types/sources";
import { chooseVerdictBand } from "./bandRules";
import { buildEvidenceItems, type AssessmentLike } from "./evidenceItems";
import { cues, description, headline, summaryText, uncertaintyLines, verdictLabel } from "./copy";

export function buildEvidenceResult(input: {
  record: CheckRecordDto;
  extractions: readonly SourceExtractionRecordDto[];
  assessments: readonly AssessmentLike[];
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
  const fullText = evidence.filter((item) => item.tier !== 4).length;
  const snippet = evidence.filter((item) => item.tier === 4).length;
  const independent = new Set(evidence.map((item) => item.domain)).size;
  const fullTextDirectEvidence = directEvidence.filter((item) => item.tier !== 4);
  const fullTextDirectIndependent = new Set(fullTextDirectEvidence.map((item) => item.domain)).size;
  const avgDirectScope = average(directEvidence.map((item) => item.scopeMatch));
  const avgFullTextDirectScope = average(fullTextDirectEvidence.map((item) => item.scopeMatch));
  const verdictBand = chooseVerdictBand({
    evidenceCount: evidence.length,
    directCount: directEvidence.length,
    fullTextDirectCount: fullTextDirectEvidence.length,
    fullTextDirectIndependent,
    avgDirectScope,
    avgFullTextDirectScope,
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
      fullText,
      primary,
      snippet,
      uncertainty:
        verdictBand === "evidence_strong"
          ? "low"
          : verdictBand === "needs_context"
            ? "high"
            : "med",
    },
    cues: cues(evidence, independent),
    evidence,
    uncertaintyLines: uncertaintyLines(verdictBand, evidence.length, snippet),
    noteText:
      "This result is based on verified fetched sources and model-assisted source assessment. The final band is selected by backend rules.",
    summaryText: summaryText(verdictBand, supports, contradicts, evidence.length),
  };
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
