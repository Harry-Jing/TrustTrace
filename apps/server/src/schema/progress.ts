import { integer, text } from "drizzle-orm/sqlite-core";
import { sqliteTable } from "drizzle-orm/sqlite-core";

import { checksTable } from "./checks";
import type { CheckApiErrorDto, CheckPhase, CheckStatus } from "../types/checks";

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
