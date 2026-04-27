import { providerCallsTable } from "../../schema/audit";
import type { ProviderCallRecordDto } from "../../types/audit";

type ProviderCallRow = typeof providerCallsTable.$inferSelect;

export function providerCallToRow(
  record: ProviderCallRecordDto,
): typeof providerCallsTable.$inferInsert {
  return {
    id: record.id,
    checkId: record.checkId,
    operation: record.operation,
    provider: record.provider,
    model: record.model,
    status: record.status,
    requestJson: record.requestJson,
    responseJson: record.responseJson,
    errorCode: record.errorCode,
    errorMessage: record.errorMessage,
    createdAt: record.createdAt,
    completedAt: record.completedAt,
  };
}

export function rowToProviderCall(row: ProviderCallRow): ProviderCallRecordDto {
  return {
    id: row.id,
    checkId: row.checkId,
    operation: row.operation,
    provider: row.provider,
    model: row.model,
    status: row.status,
    requestJson: row.requestJson,
    responseJson: row.responseJson,
    errorCode: row.errorCode ?? null,
    errorMessage: row.errorMessage ?? null,
    createdAt: row.createdAt,
    completedAt: row.completedAt ?? null,
  };
}
