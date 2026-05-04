import { type progressEventsTable } from "../../schema/progress";
import type { CheckApiErrorDto, CheckProgressDto, ProgressEventDto } from "../../types/checks";

type ProgressEventRow = typeof progressEventsTable.$inferSelect;

export function makeProgressEvent(input: {
  checkId: string;
  seq: number;
  phase: ProgressEventDto["phase"];
  percent: number;
  message: string;
  stepCode: string;
  createdAt?: string;
  status?: ProgressEventDto["status"];
  provider?: string | null;
  error?: CheckApiErrorDto | null;
}): ProgressEventDto {
  return {
    seq: input.seq,
    checkId: input.checkId,
    status: input.status ?? "running",
    phase: input.phase,
    percent: input.percent,
    message: input.message,
    provider: input.provider ?? null,
    stepCode: input.stepCode,
    error: input.error ?? null,
    createdAt: input.createdAt ?? new Date().toISOString(),
  };
}

export function eventToProgress(event: ProgressEventDto): CheckProgressDto {
  return {
    checkId: event.checkId,
    status: event.status,
    phase: event.phase,
    percent: event.percent,
    message: event.message,
    eventSeq: event.seq,
    updatedAt: event.createdAt,
  };
}

export function eventToRow(event: ProgressEventDto): typeof progressEventsTable.$inferInsert {
  return {
    checkId: event.checkId,
    seq: event.seq,
    status: event.status,
    phase: event.phase,
    percent: event.percent,
    message: event.message,
    provider: event.provider,
    stepCode: event.stepCode,
    errorJson: event.error,
    createdAt: event.createdAt,
  };
}

export function rowToEvent(row: ProgressEventRow): ProgressEventDto {
  return {
    seq: row.seq,
    checkId: row.checkId,
    status: row.status,
    phase: row.phase,
    percent: row.percent,
    message: row.message,
    provider: row.provider ?? null,
    stepCode: row.stepCode ?? null,
    error: row.errorJson ?? null,
    createdAt: row.createdAt,
  };
}
