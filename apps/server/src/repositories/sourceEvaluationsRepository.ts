import { randomUUID } from "node:crypto";

import { asc, eq } from "drizzle-orm";

import { sourceEvaluationsTable } from "../schema/audit";
import type { TrustTraceDatabase } from "../database/openDatabase";
import type { SourceEvaluationRecordDto } from "../types/audit";
import { rowToSourceEvaluation, sourceEvaluationToRow } from "./mappers/sourceEvaluationMapper";

export class SourceEvaluationsRepository {
  constructor(private readonly db: TrustTraceDatabase) {}

  createSourceEvaluation(input: Omit<SourceEvaluationRecordDto, "id">): SourceEvaluationRecordDto {
    const record: SourceEvaluationRecordDto = {
      id: `eval_${randomUUID()}`,
      ...input,
    };
    this.db.insert(sourceEvaluationsTable).values(sourceEvaluationToRow(record)).run();
    return record;
  }

  listSourceEvaluations(checkId: string): SourceEvaluationRecordDto[] {
    return this.db
      .select()
      .from(sourceEvaluationsTable)
      .where(eq(sourceEvaluationsTable.checkId, checkId))
      .orderBy(asc(sourceEvaluationsTable.createdAt))
      .all()
      .map(rowToSourceEvaluation);
  }
}
