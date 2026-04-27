import { claimAnalysesTable } from "../../schema/audit";
import type { ClaimAnalysisDto } from "../../types/claim";

type ClaimAnalysisRow = typeof claimAnalysesTable.$inferSelect;

export function claimAnalysisToRow(
  record: ClaimAnalysisDto,
): typeof claimAnalysesTable.$inferInsert {
  return {
    checkId: record.checkId,
    mainClaim: record.mainClaim,
    claimType: record.claimType,
    domain: record.domain,
    temporalScope: record.temporalScope,
    geographicScope: record.geographicScope,
    ambiguityNotesJson: record.ambiguityNotes,
    queryPlanJson: record.queryPlan,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export function rowToClaimAnalysis(row: ClaimAnalysisRow): ClaimAnalysisDto {
  return {
    checkId: row.checkId,
    mainClaim: row.mainClaim,
    claimType: row.claimType,
    domain: row.domain,
    temporalScope: row.temporalScope ?? null,
    geographicScope: row.geographicScope ?? null,
    ambiguityNotes: row.ambiguityNotesJson,
    queryPlan: row.queryPlanJson,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
