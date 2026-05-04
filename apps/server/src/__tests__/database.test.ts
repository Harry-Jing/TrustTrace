import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { Database } from "bun:sqlite";
import { describe, expect, it } from "bun:test";

import { openDatabase } from "../database/openDatabase";

describe("database schema initialization", () => {
  it("adds P1.0 audit tables, discovery strategy, and source snippet column to existing SQLite files", () => {
    const dir = mkdtempSync(join(tmpdir(), "trusttrace-schema-"));
    const dbPath = join(dir, "old.sqlite");

    try {
      const oldDb = new Database(dbPath);
      oldDb.exec(`
        CREATE TABLE checks (
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

        CREATE TABLE source_extractions (
          id TEXT PRIMARY KEY,
          check_id TEXT NOT NULL,
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
      `);
      oldDb.close();

      const database = openDatabase(dbPath);
      const checkColumns = database.sqlite.query("PRAGMA table_info(checks)").all() as {
        name: string;
      }[];
      const sourceColumns = database.sqlite
        .query("PRAGMA table_info(source_extractions)")
        .all() as { name: string }[];
      const tables = database.sqlite
        .query("SELECT name FROM sqlite_master WHERE type = 'table'")
        .all() as { name: string }[];

      expect(checkColumns.map((column) => column.name)).toContain("discovery_strategy");
      expect(sourceColumns.map((column) => column.name)).toContain("discovery_snippet");
      expect(tables.map((table) => table.name)).toContain("provider_calls");
      expect(tables.map((table) => table.name)).toContain("source_evaluations");
      database.close();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
