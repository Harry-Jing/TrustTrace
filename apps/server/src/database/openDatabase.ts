import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

import { Database } from "bun:sqlite";
import { drizzle, type BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";

import { claimAnalysesTable, providerCallsTable, sourceEvaluationsTable } from "../schema/audit";
import { checksTable } from "../schema/checks";
import { progressEventsTable } from "../schema/progress";
import { inputExtractionsTable, sourceExtractionsTable } from "../schema/sources";
import { initializeSchema } from "./schemaInit";

const schema = {
  checksTable,
  progressEventsTable,
  sourceExtractionsTable,
  inputExtractionsTable,
  claimAnalysesTable,
  providerCallsTable,
  sourceEvaluationsTable,
};

export type TrustTraceDatabase = BunSQLiteDatabase<typeof schema>;

export interface OpenDatabaseResult {
  db: TrustTraceDatabase;
  sqlite: Database;
  close: () => void;
}

export function openDatabase(dbPath: string): OpenDatabaseResult {
  if (dbPath !== ":memory:") {
    mkdirSync(dirname(dbPath), { recursive: true });
  }

  const sqlite = new Database(dbPath);
  sqlite.run("PRAGMA foreign_keys = ON;");
  if (dbPath !== ":memory:") {
    sqlite.run("PRAGMA journal_mode = WAL;");
  }

  initializeSchema(sqlite);

  return {
    sqlite,
    db: drizzle(sqlite, { schema }),
    close: () => {
      sqlite.close();
    },
  };
}
