import { randomUUID } from "node:crypto";

import { asc, eq } from "drizzle-orm";

import { sourceExtractionsTable } from "../schema/sources";
import type { TrustTraceDatabase } from "../database/openDatabase";
import type {
  NewSourceExtractionDto,
  SourceExtractionRecordDto,
  SourceExtractionUpdateDto,
} from "../types/sources";
import { rowToSourceExtraction, sourceExtractionToRow } from "./mappers/sourceExtractionMapper";

export class SourceExtractionsRepository {
  constructor(private readonly db: TrustTraceDatabase) {}

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
}
