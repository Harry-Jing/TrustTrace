import { randomUUID } from "node:crypto";

import { and, asc, desc, eq, gt } from "drizzle-orm";

import { checksTable, progressEventsTable } from "./schema";
import type { TrustTraceDatabase } from "./database";
import type {
  CheckInputDto,
  CheckListItemDto,
  CheckProgressDto,
  CheckRecordDto,
  CheckResultDto,
  CreateCheckResponseDto,
  ProgressEventDto,
} from "./types";

type CheckRow = typeof checksTable.$inferSelect;
type ProgressEventRow = typeof progressEventsTable.$inferSelect;

export class ChecksRepository {
  constructor(private readonly db: TrustTraceDatabase) {}

  createCheck(input: CheckInputDto): CheckRecordDto {
    const checkId = `check-${randomUUID()}`;
    const createdAt = new Date().toISOString();
    const initialEvent = makeProgressEvent({
      checkId,
      seq: 1,
      phase: "understanding",
      percent: 8,
      message: "Reading the submitted input.",
      stepCode: "understanding",
      createdAt,
    });
    const progress = eventToProgress(initialEvent);

    this.db.transaction((tx) => {
      tx.insert(checksTable)
        .values({
          id: checkId,
          status: "running",
          inputJson: input,
          progressJson: progress,
          resultJson: null,
          errorJson: null,
          createdAt,
          updatedAt: createdAt,
          completedAt: null,
        })
        .run();
      tx.insert(progressEventsTable).values(eventToRow(initialEvent)).run();
    });

    return {
      checkId,
      status: "running",
      input,
      progress,
      result: null,
      error: null,
      createdAt,
      updatedAt: createdAt,
      completedAt: null,
    };
  }

  getCheck(checkId: string): CheckRecordDto | null {
    const row = this.db.select().from(checksTable).where(eq(checksTable.id, checkId)).get();
    return row ? rowToRecord(row) : null;
  }

  listChecks(limit: number, offset: number): CheckListItemDto[] {
    return this.db
      .select()
      .from(checksTable)
      .orderBy(desc(checksTable.createdAt))
      .limit(limit)
      .offset(offset)
      .all()
      .map(rowToListItem);
  }

  listEventsAfter(checkId: string, afterSeq: number): ProgressEventDto[] {
    return this.db
      .select()
      .from(progressEventsTable)
      .where(and(eq(progressEventsTable.checkId, checkId), gt(progressEventsTable.seq, afterSeq)))
      .orderBy(asc(progressEventsTable.seq))
      .all()
      .map(rowToEvent);
  }

  recordProgressEvent(event: ProgressEventDto): void {
    this.db.transaction((tx) => {
      tx.insert(progressEventsTable).values(eventToRow(event)).run();
      tx.update(checksTable)
        .set({
          status: event.status,
          progressJson: eventToProgress(event),
          updatedAt: event.createdAt,
        })
        .where(eq(checksTable.id, event.checkId))
        .run();
    });
  }

  completeCheckWithEvent(event: ProgressEventDto, result: CheckResultDto): void {
    this.db.transaction((tx) => {
      tx.insert(progressEventsTable).values(eventToRow(event)).run();
      tx.update(checksTable)
        .set({
          status: "completed",
          progressJson: eventToProgress(event),
          resultJson: result,
          errorJson: null,
          updatedAt: event.createdAt,
          completedAt: event.createdAt,
        })
        .where(eq(checksTable.id, event.checkId))
        .run();
    });
  }
}

export function toCreateCheckResponse(record: CheckRecordDto): CreateCheckResponseDto {
  return {
    checkId: record.checkId,
    status: record.status,
    progress: record.progress,
    eventsUrl: `/v1/checks/${encodeURIComponent(record.checkId)}/events`,
    createdAt: record.createdAt,
  };
}

export function makeProgressEvent(input: {
  checkId: string;
  seq: number;
  phase: ProgressEventDto["phase"];
  percent: number;
  message: string;
  stepCode: string;
  createdAt?: string;
  status?: ProgressEventDto["status"];
}): ProgressEventDto {
  return {
    seq: input.seq,
    checkId: input.checkId,
    status: input.status ?? "running",
    phase: input.phase,
    percent: input.percent,
    message: input.message,
    provider: null,
    stepCode: input.stepCode,
    error: null,
    createdAt: input.createdAt ?? new Date().toISOString(),
  };
}

function eventToProgress(event: ProgressEventDto): CheckProgressDto {
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

function eventToRow(event: ProgressEventDto): typeof progressEventsTable.$inferInsert {
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

function rowToRecord(row: CheckRow): CheckRecordDto {
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

function rowToEvent(row: ProgressEventRow): ProgressEventDto {
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

function rowToListItem(row: CheckRow): CheckListItemDto {
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
  return "Check is running through the backend pipeline.";
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
