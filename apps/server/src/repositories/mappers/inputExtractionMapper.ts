import { inputExtractionsTable } from "../../schema/sources";
import type { InputExtractionRecordDto } from "../../types/sources";

type InputExtractionRow = typeof inputExtractionsTable.$inferSelect;

export function inputExtractionToRow(
  record: InputExtractionRecordDto,
): typeof inputExtractionsTable.$inferInsert {
  return {
    id: record.id,
    checkId: record.checkId,
    inputUrl: record.inputUrl,
    resolvedUrl: record.resolvedUrl,
    domain: record.domain,
    title: record.title,
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

export function rowToInputExtraction(row: InputExtractionRow): InputExtractionRecordDto {
  return {
    id: row.id,
    checkId: row.checkId,
    inputUrl: row.inputUrl,
    resolvedUrl: row.resolvedUrl ?? null,
    domain: row.domain ?? null,
    title: row.title ?? null,
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
