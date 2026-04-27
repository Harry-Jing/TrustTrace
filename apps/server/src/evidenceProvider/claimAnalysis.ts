import type { QueryPlanDto } from "../types/claim";
import type { ClaimAnalysisResponse } from "./openaiSchemas";
import type { ClaimAnalysisResult } from "./types";

export function normalizeClaimAnalysis(
  parsed: ClaimAnalysisResponse,
  fallbackClaim: string,
): ClaimAnalysisResult {
  const mainClaim = parsed.mainClaim.trim() || fallbackClaim.trim();
  return {
    mainClaim,
    claimType: parsed.claimType,
    domain: parsed.domain,
    temporalScope: normalizeNullableString(parsed.temporalScope),
    geographicScope: normalizeNullableString(parsed.geographicScope),
    ambiguityNotes: parsed.ambiguityNotes.map((note) => note.trim()).filter(Boolean),
    queryPlan: normalizeQueryPlan(parsed.queryPlan, mainClaim),
  };
}

function normalizeQueryPlan(queryPlan: QueryPlanDto, mainClaim: string): QueryPlanDto {
  const neutral = normalizeQueries(queryPlan.neutral);
  return {
    neutral: neutral.length > 0 ? neutral : [mainClaim],
    authority: normalizeQueries(queryPlan.authority),
    challenge: normalizeQueries(queryPlan.challenge),
  };
}

function normalizeQueries(queries: readonly string[]): string[] {
  return queries
    .map((query) => query.trim())
    .filter(Boolean)
    .slice(0, 5);
}

function normalizeNullableString(value: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
