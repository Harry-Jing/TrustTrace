import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

import type {
  CheckApiErrorDto,
  CheckInputDto,
  CheckPhase,
  CheckProgressDto,
  CheckResultDto,
  CheckStatus,
  ClaimAnalysisDto,
  ProviderCallStatus,
  QueryPlanDto,
  SourceExtractionStatus,
  SourceEvaluationRecordDto,
} from "./types";

export const checksTable = sqliteTable("checks", {
  id: text("id").primaryKey(),
  status: text("status").notNull().$type<CheckStatus>(),
  inputJson: text("input_json", { mode: "json" }).notNull().$type<CheckInputDto>(),
  progressJson: text("progress_json", { mode: "json" }).notNull().$type<CheckProgressDto>(),
  resultJson: text("result_json", { mode: "json" }).$type<CheckResultDto | null>(),
  errorJson: text("error_json", { mode: "json" }).$type<CheckApiErrorDto | null>(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  completedAt: text("completed_at"),
});

export const progressEventsTable = sqliteTable("progress_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  checkId: text("check_id")
    .notNull()
    .references(() => checksTable.id, { onDelete: "cascade" }),
  seq: integer("seq").notNull(),
  status: text("status").notNull().$type<CheckStatus>(),
  phase: text("phase").notNull().$type<CheckPhase>(),
  percent: integer("percent").notNull(),
  message: text("message").notNull(),
  provider: text("provider"),
  stepCode: text("step_code"),
  errorJson: text("error_json", { mode: "json" }).$type<CheckApiErrorDto | null>(),
  createdAt: text("created_at").notNull(),
});

export const sourceExtractionsTable = sqliteTable("source_extractions", {
  id: text("id").primaryKey(),
  checkId: text("check_id")
    .notNull()
    .references(() => checksTable.id, { onDelete: "cascade" }),
  candidateUrl: text("candidate_url").notNull(),
  resolvedUrl: text("resolved_url"),
  domain: text("domain"),
  title: text("title"),
  discoverySnippet: text("discovery_snippet"),
  discoveryProvider: text("discovery_provider").notNull(),
  discoveryRank: integer("discovery_rank").notNull(),
  verificationStatus: text("verification_status").notNull().$type<SourceExtractionStatus>(),
  httpStatus: integer("http_status"),
  contentType: text("content_type"),
  contentHash: text("content_hash"),
  extractionMethod: text("extraction_method"),
  extractedText: text("extracted_text"),
  textExcerpt: text("text_excerpt"),
  failureCode: text("failure_code"),
  failureMessage: text("failure_message"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const claimAnalysesTable = sqliteTable("claim_analyses", {
  checkId: text("check_id")
    .primaryKey()
    .references(() => checksTable.id, { onDelete: "cascade" }),
  mainClaim: text("main_claim").notNull(),
  claimType: text("claim_type").notNull().$type<ClaimAnalysisDto["claimType"]>(),
  domain: text("domain").notNull().$type<ClaimAnalysisDto["domain"]>(),
  temporalScope: text("temporal_scope"),
  geographicScope: text("geographic_scope"),
  ambiguityNotesJson: text("ambiguity_notes_json", { mode: "json" }).notNull().$type<string[]>(),
  queryPlanJson: text("query_plan_json", { mode: "json" }).notNull().$type<QueryPlanDto>(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const providerCallsTable = sqliteTable("provider_calls", {
  id: text("id").primaryKey(),
  checkId: text("check_id")
    .notNull()
    .references(() => checksTable.id, { onDelete: "cascade" }),
  operation: text("operation").notNull(),
  provider: text("provider").notNull(),
  model: text("model").notNull(),
  status: text("status").notNull().$type<ProviderCallStatus>(),
  requestJson: text("request_json", { mode: "json" }),
  responseJson: text("response_json", { mode: "json" }),
  errorCode: text("error_code"),
  errorMessage: text("error_message"),
  createdAt: text("created_at").notNull(),
  completedAt: text("completed_at"),
});

export const inputExtractionsTable = sqliteTable("input_extractions", {
  id: text("id").primaryKey(),
  checkId: text("check_id")
    .notNull()
    .references(() => checksTable.id, { onDelete: "cascade" }),
  inputUrl: text("input_url").notNull(),
  resolvedUrl: text("resolved_url"),
  domain: text("domain"),
  title: text("title"),
  verificationStatus: text("verification_status").notNull().$type<SourceExtractionStatus>(),
  httpStatus: integer("http_status"),
  contentType: text("content_type"),
  contentHash: text("content_hash"),
  extractionMethod: text("extraction_method"),
  extractedText: text("extracted_text"),
  textExcerpt: text("text_excerpt"),
  failureCode: text("failure_code"),
  failureMessage: text("failure_message"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const sourceEvaluationsTable = sqliteTable("source_evaluations", {
  id: text("id").primaryKey(),
  checkId: text("check_id")
    .notNull()
    .references(() => checksTable.id, { onDelete: "cascade" }),
  sourceExtractionId: text("source_extraction_id")
    .notNull()
    .references(() => sourceExtractionsTable.id, { onDelete: "cascade" }),
  sourceUrl: text("source_url").notNull(),
  provider: text("provider").notNull(),
  model: text("model").notNull(),
  relation: text("relation").notNull().$type<SourceEvaluationRecordDto["relation"]>(),
  scopeMatch: real("scope_match").notNull(),
  credibilityLabel: text("credibility_label").notNull(),
  isPrimary: integer("is_primary", { mode: "boolean" }).notNull(),
  rationale: text("rationale").notNull(),
  evidenceText: text("evidence_text").notNull(),
  createdAt: text("created_at").notNull(),
});
