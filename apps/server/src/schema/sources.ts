import { integer, text } from "drizzle-orm/sqlite-core";
import { sqliteTable } from "drizzle-orm/sqlite-core";

import { checksTable } from "./checks";
import type { SourceExtractionStatus } from "../types/sources";

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
