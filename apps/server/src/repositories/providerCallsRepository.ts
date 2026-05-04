import { randomUUID } from "node:crypto";

import { asc, eq } from "drizzle-orm";

import { providerCallsTable } from "../schema/audit";
import type { TrustTraceDatabase } from "../database/openDatabase";
import type {
  NewProviderCallDto,
  ProviderCallRecordDto,
  ProviderCallUpdateDto,
} from "../types/audit";
import { providerCallToRow, rowToProviderCall } from "./mappers/providerCallMapper";

export class ProviderCallsRepository {
  constructor(private readonly db: TrustTraceDatabase) {}

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
}
