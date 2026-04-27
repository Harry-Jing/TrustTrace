import { checksTable } from "../../schema/checks";
import type { CheckListItemDto, CheckRecordDto, CreateCheckResponseDto } from "../../types/checks";

type CheckRow = typeof checksTable.$inferSelect;

export function toCreateCheckResponse(record: CheckRecordDto): CreateCheckResponseDto {
  return {
    checkId: record.checkId,
    status: record.status,
    progress: record.progress,
    eventsUrl: `/v1/checks/${encodeURIComponent(record.checkId)}/events`,
    createdAt: record.createdAt,
  };
}

export function rowToRecord(row: CheckRow): CheckRecordDto {
  return {
    checkId: row.id,
    status: row.status,
    input: row.inputJson,
    progress: row.progressJson,
    result: row.resultJson ?? null,
    error: row.errorJson ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    completedAt: row.completedAt ?? null,
  };
}

export function rowToListItem(row: CheckRow): CheckListItemDto {
  return {
    checkId: row.id,
    claim: truncate(row.inputJson.content, 96),
    snippet: listSnippet(row),
    createdAt: row.createdAt,
    cue: listCue(row),
    tone: listTone(row),
  };
}

function listSnippet(row: CheckRow): string {
  if (row.status === "completed") {
    return row.resultJson?.summaryText ?? "Backend check completed.";
  }
  if (row.status === "failed") {
    return row.errorJson?.message ?? "The backend check failed.";
  }
  return "Check is running through the backend evidence pipeline.";
}

function listCue(row: CheckRow): string {
  if (row.status === "completed") return row.resultJson?.verdictLabel || "needs context";
  if (row.status === "failed") return "failed";
  return "checking";
}

function listTone(row: CheckRow): CheckListItemDto["tone"] {
  if (row.status === "completed") return "accent";
  if (row.status === "failed") return "warn";
  return "default";
}

function truncate(value: string, maxLength: number): string {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 1)}…`;
}
