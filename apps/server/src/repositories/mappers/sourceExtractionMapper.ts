import { sourceExtractionsTable } from "../../schema/sources";
import type { SourceExtractionRecordDto } from "../../types/sources";

type SourceExtractionRow = typeof sourceExtractionsTable.$inferSelect;

export function sourceExtractionToRow(
  record: SourceExtractionRecordDto,
): typeof sourceExtractionsTable.$inferInsert {
  return {
    id: record.id,
    checkId: record.checkId,
    candidateUrl: record.candidateUrl,
    resolvedUrl: record.resolvedUrl,
    domain: record.domain,
    title: record.title,
    discoverySnippet: record.discoverySnippet,
    discoveryProvider: record.discoveryProvider,
    discoveryRank: record.discoveryRank,
    verificationStatus: record.verificationStatus,
    httpStatus: record.httpStatus,
    contentType: record.contentType,
    contentHash: record.contentHash,
    extractionMethod: record.extractionMethod,
    extractedText: record.extractedText,
    textExcerpt: record.textExcerpt,
    failureCode: record.failureCode,
    failureMessage: record.failureMessage,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export function rowToSourceExtraction(row: SourceExtractionRow): SourceExtractionRecordDto {
  return {
    id: row.id,
    checkId: row.checkId,
    candidateUrl: row.candidateUrl,
    resolvedUrl: row.resolvedUrl ?? null,
    domain: row.domain ?? null,
    title: row.title ?? null,
    discoverySnippet: row.discoverySnippet ?? null,
    discoveryProvider: row.discoveryProvider,
    discoveryRank: row.discoveryRank,
    verificationStatus: row.verificationStatus,
    httpStatus: row.httpStatus ?? null,
    contentType: row.contentType ?? null,
    contentHash: row.contentHash ?? null,
    extractionMethod: row.extractionMethod ?? null,
    extractedText: row.extractedText ?? null,
    textExcerpt: row.textExcerpt ?? null,
    failureCode: row.failureCode ?? null,
    failureMessage: row.failureMessage ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
