import { randomUUID } from "node:crypto";

import { and, asc, desc, eq, gt } from "drizzle-orm";

import {
  checksTable,
  claimAnalysesTable,
  inputExtractionsTable,
  progressEventsTable,
  providerCallsTable,
  sourceEvaluationsTable,
  sourceExtractionsTable,
} from "./schema";
import type { TrustTraceDatabase } from "./database";
import type {
  CheckApiErrorDto,
  CheckInputDto,
  CheckListItemDto,
  CheckProgressDto,
  CheckRecordDto,
  CheckResultDto,
  ClaimAnalysisDto,
  CreateCheckResponseDto,
  InputExtractionRecordDto,
  NewProviderCallDto,
  NewSourceExtractionDto,
  ProviderCallRecordDto,
  ProviderCallUpdateDto,
  ProgressEventDto,
  SourceEvaluationRecordDto,
  SourceExtractionRecordDto,
  SourceExtractionUpdateDto,
} from "./types";

type CheckRow = typeof checksTable.$inferSelect;
type ClaimAnalysisRow = typeof claimAnalysesTable.$inferSelect;
type InputExtractionRow = typeof inputExtractionsTable.$inferSelect;
type ProgressEventRow = typeof progressEventsTable.$inferSelect;
type ProviderCallRow = typeof providerCallsTable.$inferSelect;
type SourceEvaluationRow = typeof sourceEvaluationsTable.$inferSelect;
type SourceExtractionRow = typeof sourceExtractionsTable.$inferSelect;

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

  createSourceExtraction(input: NewSourceExtractionDto): SourceExtractionRecordDto {
    const record: SourceExtractionRecordDto = {
      id: `src_${randomUUID()}`,
      checkId: input.checkId,
      candidateUrl: input.candidateUrl,
      resolvedUrl: null,
      domain: null,
      title: input.title,
      discoverySnippet: input.discoverySnippet,
      discoveryProvider: input.discoveryProvider,
      discoveryRank: input.discoveryRank,
      verificationStatus: "candidate",
      httpStatus: null,
      contentType: null,
      contentHash: null,
      extractionMethod: null,
      extractedText: null,
      textExcerpt: null,
      failureCode: null,
      failureMessage: null,
      createdAt: input.createdAt,
      updatedAt: input.createdAt,
    };

    this.db.insert(sourceExtractionsTable).values(sourceExtractionToRow(record)).run();
    return record;
  }

  updateSourceExtraction(
    id: string,
    update: SourceExtractionUpdateDto,
  ): SourceExtractionRecordDto | null {
    const values: Partial<typeof sourceExtractionsTable.$inferInsert> = {
      updatedAt: update.updatedAt,
    };

    if (update.resolvedUrl !== undefined) values.resolvedUrl = update.resolvedUrl;
    if (update.domain !== undefined) values.domain = update.domain;
    if (update.title !== undefined) values.title = update.title;
    if (update.verificationStatus !== undefined) {
      values.verificationStatus = update.verificationStatus;
    }
    if (update.httpStatus !== undefined) values.httpStatus = update.httpStatus;
    if (update.contentType !== undefined) values.contentType = update.contentType;
    if (update.contentHash !== undefined) values.contentHash = update.contentHash;
    if (update.extractionMethod !== undefined) values.extractionMethod = update.extractionMethod;
    if (update.extractedText !== undefined) values.extractedText = update.extractedText;
    if (update.textExcerpt !== undefined) values.textExcerpt = update.textExcerpt;
    if (update.failureCode !== undefined) values.failureCode = update.failureCode;
    if (update.failureMessage !== undefined) values.failureMessage = update.failureMessage;

    this.db
      .update(sourceExtractionsTable)
      .set(values)
      .where(eq(sourceExtractionsTable.id, id))
      .run();
    const row = this.db
      .select()
      .from(sourceExtractionsTable)
      .where(eq(sourceExtractionsTable.id, id))
      .get();
    return row ? rowToSourceExtraction(row) : null;
  }

  listSourceExtractions(checkId: string): SourceExtractionRecordDto[] {
    return this.db
      .select()
      .from(sourceExtractionsTable)
      .where(eq(sourceExtractionsTable.checkId, checkId))
      .orderBy(asc(sourceExtractionsTable.discoveryRank))
      .all()
      .map(rowToSourceExtraction);
  }

  saveClaimAnalysis(input: ClaimAnalysisDto): ClaimAnalysisDto {
    this.db
      .insert(claimAnalysesTable)
      .values(claimAnalysisToRow(input))
      .onConflictDoUpdate({
        target: claimAnalysesTable.checkId,
        set: {
          mainClaim: input.mainClaim,
          claimType: input.claimType,
          domain: input.domain,
          temporalScope: input.temporalScope,
          geographicScope: input.geographicScope,
          ambiguityNotesJson: input.ambiguityNotes,
          queryPlanJson: input.queryPlan,
          updatedAt: input.updatedAt,
        },
      })
      .run();
    return input;
  }

  getClaimAnalysis(checkId: string): ClaimAnalysisDto | null {
    const row = this.db
      .select()
      .from(claimAnalysesTable)
      .where(eq(claimAnalysesTable.checkId, checkId))
      .get();
    return row ? rowToClaimAnalysis(row) : null;
  }

  createProviderCall(input: NewProviderCallDto): ProviderCallRecordDto {
    const record: ProviderCallRecordDto = {
      id: `provider_${randomUUID()}`,
      checkId: input.checkId,
      operation: input.operation,
      provider: input.provider,
      model: input.model,
      status: "started",
      requestJson: input.requestJson,
      responseJson: null,
      errorCode: null,
      errorMessage: null,
      createdAt: input.createdAt,
      completedAt: null,
    };

    this.db.insert(providerCallsTable).values(providerCallToRow(record)).run();
    return record;
  }

  updateProviderCall(id: string, update: ProviderCallUpdateDto): ProviderCallRecordDto | null {
    this.db
      .update(providerCallsTable)
      .set({
        status: update.status,
        responseJson: update.responseJson ?? null,
        errorCode: update.errorCode ?? null,
        errorMessage: update.errorMessage ?? null,
        completedAt: update.completedAt,
      })
      .where(eq(providerCallsTable.id, id))
      .run();
    const row = this.db
      .select()
      .from(providerCallsTable)
      .where(eq(providerCallsTable.id, id))
      .get();
    return row ? rowToProviderCall(row) : null;
  }

  listProviderCalls(checkId: string): ProviderCallRecordDto[] {
    return this.db
      .select()
      .from(providerCallsTable)
      .where(eq(providerCallsTable.checkId, checkId))
      .orderBy(asc(providerCallsTable.createdAt))
      .all()
      .map(rowToProviderCall);
  }

  createInputExtraction(input: {
    checkId: string;
    inputUrl: string;
    createdAt: string;
  }): InputExtractionRecordDto {
    const record: InputExtractionRecordDto = {
      id: `input_${randomUUID()}`,
      checkId: input.checkId,
      inputUrl: input.inputUrl,
      resolvedUrl: null,
      domain: null,
      title: null,
      verificationStatus: "candidate",
      httpStatus: null,
      contentType: null,
      contentHash: null,
      extractionMethod: null,
      extractedText: null,
      textExcerpt: null,
      failureCode: null,
      failureMessage: null,
      createdAt: input.createdAt,
      updatedAt: input.createdAt,
    };
    this.db.insert(inputExtractionsTable).values(inputExtractionToRow(record)).run();
    return record;
  }

  updateInputExtraction(
    id: string,
    update: SourceExtractionUpdateDto,
  ): InputExtractionRecordDto | null {
    const values: Partial<typeof inputExtractionsTable.$inferInsert> = {
      updatedAt: update.updatedAt,
    };

    if (update.resolvedUrl !== undefined) values.resolvedUrl = update.resolvedUrl;
    if (update.domain !== undefined) values.domain = update.domain;
    if (update.title !== undefined) values.title = update.title;
    if (update.verificationStatus !== undefined) {
      values.verificationStatus = update.verificationStatus;
    }
    if (update.httpStatus !== undefined) values.httpStatus = update.httpStatus;
    if (update.contentType !== undefined) values.contentType = update.contentType;
    if (update.contentHash !== undefined) values.contentHash = update.contentHash;
    if (update.extractionMethod !== undefined) values.extractionMethod = update.extractionMethod;
    if (update.extractedText !== undefined) values.extractedText = update.extractedText;
    if (update.textExcerpt !== undefined) values.textExcerpt = update.textExcerpt;
    if (update.failureCode !== undefined) values.failureCode = update.failureCode;
    if (update.failureMessage !== undefined) values.failureMessage = update.failureMessage;

    this.db.update(inputExtractionsTable).set(values).where(eq(inputExtractionsTable.id, id)).run();
    const row = this.db
      .select()
      .from(inputExtractionsTable)
      .where(eq(inputExtractionsTable.id, id))
      .get();
    return row ? rowToInputExtraction(row) : null;
  }

  listInputExtractions(checkId: string): InputExtractionRecordDto[] {
    return this.db
      .select()
      .from(inputExtractionsTable)
      .where(eq(inputExtractionsTable.checkId, checkId))
      .orderBy(asc(inputExtractionsTable.createdAt))
      .all()
      .map(rowToInputExtraction);
  }

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

function sourceExtractionToRow(
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

function rowToSourceExtraction(row: SourceExtractionRow): SourceExtractionRecordDto {
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

function claimAnalysisToRow(record: ClaimAnalysisDto): typeof claimAnalysesTable.$inferInsert {
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

function rowToClaimAnalysis(row: ClaimAnalysisRow): ClaimAnalysisDto {
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

function providerCallToRow(record: ProviderCallRecordDto): typeof providerCallsTable.$inferInsert {
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

function rowToProviderCall(row: ProviderCallRow): ProviderCallRecordDto {
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

function inputExtractionToRow(
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

function rowToInputExtraction(row: InputExtractionRow): InputExtractionRecordDto {
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

function sourceEvaluationToRow(
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

function rowToSourceEvaluation(row: SourceEvaluationRow): SourceEvaluationRecordDto {
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
