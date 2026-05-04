import { randomUUID } from "node:crypto";

import { and, asc, desc, eq, gt } from "drizzle-orm";

import { checksTable } from "../schema/checks";
import { progressEventsTable } from "../schema/progress";
import type { TrustTraceDatabase } from "../database/openDatabase";
import type {
  CheckApiErrorDto,
  CheckInputDto,
  CheckListItemDto,
  DiscoveryStrategy,
  CheckRecordDto,
  ProgressEventDto,
} from "../types/checks";
import type { CheckResultDto } from "../types/results";
import { rowToListItem, rowToRecord } from "./mappers/checkMapper";
import {
  eventToProgress,
  eventToRow,
  makeProgressEvent,
  rowToEvent,
} from "./mappers/progressMapper";

export class CheckRecordsRepository {
  constructor(private readonly db: TrustTraceDatabase) {}

  createCheck(input: CheckInputDto, discoveryStrategy: DiscoveryStrategy): CheckRecordDto {
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
          discoveryStrategy,
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
      discoveryStrategy,
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

  failCheckWithEvent(event: ProgressEventDto, error: CheckApiErrorDto): void {
    this.db.transaction((tx) => {
      tx.insert(progressEventsTable).values(eventToRow(event)).run();
      tx.update(checksTable)
        .set({
          status: "failed",
          progressJson: eventToProgress(event),
          resultJson: null,
          errorJson: error,
          updatedAt: event.createdAt,
          completedAt: event.createdAt,
        })
        .where(eq(checksTable.id, event.checkId))
        .run();
    });
  }
}
