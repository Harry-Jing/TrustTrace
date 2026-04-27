import { sourceEvaluationsTable } from "../../schema/audit";
import type { SourceEvaluationRecordDto } from "../../types/audit";

type SourceEvaluationRow = typeof sourceEvaluationsTable.$inferSelect;

export function sourceEvaluationToRow(
  record: SourceEvaluationRecordDto,
): typeof sourceEvaluationsTable.$inferInsert {
  return {
    id: record.id,
    checkId: record.checkId,
    sourceExtractionId: record.sourceExtractionId,
    sourceUrl: record.sourceUrl,
    provider: record.provider,
    model: record.model,
    relation: record.relation,
    scopeMatch: record.scopeMatch,
    credibilityLabel: record.credibilityLabel,
    isPrimary: record.isPrimary,
    rationale: record.rationale,
    evidenceText: record.evidenceText,
    createdAt: record.createdAt,
  };
}

export function rowToSourceEvaluation(row: SourceEvaluationRow): SourceEvaluationRecordDto {
  return {
    id: row.id,
    checkId: row.checkId,
    sourceExtractionId: row.sourceExtractionId,
    sourceUrl: row.sourceUrl,
    provider: row.provider,
    model: row.model,
    relation: row.relation,
    scopeMatch: row.scopeMatch,
    credibilityLabel: row.credibilityLabel,
    isPrimary: row.isPrimary,
    rationale: row.rationale,
    evidenceText: row.evidenceText,
    createdAt: row.createdAt,
  };
}
