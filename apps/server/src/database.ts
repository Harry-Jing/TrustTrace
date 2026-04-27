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

    CREATE INDEX IF NOT EXISTS checks_created_at_idx ON checks(created_at);
  `);
}
