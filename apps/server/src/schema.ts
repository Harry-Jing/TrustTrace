import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import type {
  CheckApiErrorDto,
  CheckInputDto,
  CheckPhase,
  CheckProgressDto,
  CheckResultDto,
  CheckStatus,
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
