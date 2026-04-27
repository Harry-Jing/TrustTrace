import { integer, real, text } from "drizzle-orm/sqlite-core";
import { sqliteTable } from "drizzle-orm/sqlite-core";

import { checksTable } from "./checks";
import { sourceExtractionsTable } from "./sources";
import type { ProviderCallStatus, SourceEvaluationRecordDto } from "../types/audit";
import type { ClaimAnalysisDto, QueryPlanDto } from "../types/claim";

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
