import type { Database } from "bun:sqlite";

import { ensureColumn } from "./migrations";

export function initializeSchema(sqlite: Database) {
  sqlite.run(`
    CREATE TABLE IF NOT EXISTS checks (
      id TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      input_json TEXT NOT NULL,
      discovery_strategy TEXT NOT NULL DEFAULT 'llm_web',
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
      discovery_snippet TEXT,
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

    CREATE TABLE IF NOT EXISTS claim_analyses (
      check_id TEXT PRIMARY KEY REFERENCES checks(id) ON DELETE CASCADE,
      main_claim TEXT NOT NULL,
      claim_type TEXT NOT NULL,
      domain TEXT NOT NULL,
      temporal_scope TEXT,
      geographic_scope TEXT,
      ambiguity_notes_json TEXT NOT NULL,
      query_plan_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS provider_calls (
      id TEXT PRIMARY KEY,
      check_id TEXT NOT NULL REFERENCES checks(id) ON DELETE CASCADE,
      operation TEXT NOT NULL,
      provider TEXT NOT NULL,
      model TEXT NOT NULL,
      status TEXT NOT NULL,
      request_json TEXT,
      response_json TEXT,
      error_code TEXT,
      error_message TEXT,
      created_at TEXT NOT NULL,
      completed_at TEXT
    );

    CREATE INDEX IF NOT EXISTS provider_calls_check_operation_idx
      ON provider_calls(check_id, operation);

    CREATE TABLE IF NOT EXISTS input_extractions (
      id TEXT PRIMARY KEY,
      check_id TEXT NOT NULL REFERENCES checks(id) ON DELETE CASCADE,
      input_url TEXT NOT NULL,
      resolved_url TEXT,
      domain TEXT,
      title TEXT,
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

    CREATE INDEX IF NOT EXISTS input_extractions_check_idx
      ON input_extractions(check_id);

    CREATE TABLE IF NOT EXISTS source_evaluations (
      id TEXT PRIMARY KEY,
      check_id TEXT NOT NULL REFERENCES checks(id) ON DELETE CASCADE,
      source_extraction_id TEXT NOT NULL REFERENCES source_extractions(id) ON DELETE CASCADE,
      source_url TEXT NOT NULL,
      provider TEXT NOT NULL,
      model TEXT NOT NULL,
      relation TEXT NOT NULL,
      scope_match REAL NOT NULL,
      credibility_label TEXT NOT NULL,
      is_primary INTEGER NOT NULL,
      rationale TEXT NOT NULL,
      evidence_text TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS source_evaluations_check_source_idx
      ON source_evaluations(check_id, source_extraction_id);
  `);

  ensureColumn(
    sqlite,
    "checks",
    "discovery_strategy",
    "discovery_strategy TEXT NOT NULL DEFAULT 'llm_web'",
  );
  ensureColumn(sqlite, "source_extractions", "discovery_snippet", "discovery_snippet TEXT");
}
