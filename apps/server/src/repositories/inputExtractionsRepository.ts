import { randomUUID } from "node:crypto";

import { asc, eq } from "drizzle-orm";

import { inputExtractionsTable } from "../schema/sources";
import type { TrustTraceDatabase } from "../database/openDatabase";
import type { InputExtractionRecordDto, SourceExtractionUpdateDto } from "../types/sources";
import { inputExtractionToRow, rowToInputExtraction } from "./mappers/inputExtractionMapper";

export class InputExtractionsRepository {
  constructor(private readonly db: TrustTraceDatabase) {}

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
    if (update.verificationStatus !== undefined)
      values.verificationStatus = update.verificationStatus;
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
}
