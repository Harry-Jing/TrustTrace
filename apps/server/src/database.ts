import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

import { Database } from "bun:sqlite";
import { drizzle, type BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";

import * as schema from "./schema";

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
  sqlite.exec("PRAGMA foreign_keys = ON;");
  if (dbPath !== ":memory:") {
    sqlite.exec("PRAGMA journal_mode = WAL;");
  }

  initializeSchema(sqlite);

  return {
    sqlite,
    db: drizzle(sqlite, { schema }),
    close: () => sqlite.close(),
  };
}

function initializeSchema(sqlite: Database) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS checks (
      id TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      input_json TEXT NOT NULL,
      progress_json TEXT NOT NULL,
      result_json TEXT,
      error_json TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS progress_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      check_id TEXT NOT NULL REFERENCES checks(id) ON DELETE CASCADE,
      seq INTEGER NOT NULL,
      status TEXT NOT NULL,
      phase TEXT NOT NULL,
      percent INTEGER NOT NULL,
      message TEXT NOT NULL,
      provider TEXT,
      step_code TEXT,
      error_json TEXT,
      created_at TEXT NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS progress_events_check_seq_idx
      ON progress_events(check_id, seq);

    CREATE TABLE IF NOT EXISTS source_extractions (
      id TEXT PRIMARY KEY,
      check_id TEXT NOT NULL REFERENCES checks(id) ON DELETE CASCADE,
      candidate_url TEXT NOT NULL,
      resolved_url TEXT,
      domain TEXT,
      title TEXT,
      discovery_provider TEXT NOT NULL,
      discovery_rank INTEGER NOT NULL,
      verification_status TEXT NOT NULL,
      http_status INTEGER,
      content_type TEXT,
      content_hash TEXT,
      extraction_method TEXT,
      extracted_text TEXT,
      text_excerpt TEXT,
      failure_code TEXT,
      failure_message TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS checks_created_at_idx ON checks(created_at);
    CREATE INDEX IF NOT EXISTS source_extractions_check_rank_idx
      ON source_extractions(check_id, discovery_rank);
  `);
}
