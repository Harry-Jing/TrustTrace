import { text } from "drizzle-orm/sqlite-core";
import { sqliteTable } from "drizzle-orm/sqlite-core";

import type {
  CheckApiErrorDto,
  CheckInputDto,
  CheckProgressDto,
  CheckStatus,
  DiscoveryStrategy,
} from "../types/checks";
import type { CheckResultDto } from "../types/results";

export const checksTable = sqliteTable("checks", {
  id: text("id").primaryKey(),
  status: text("status").notNull().$type<CheckStatus>(),
  inputJson: text("input_json", { mode: "json" }).notNull().$type<CheckInputDto>(),
  discoveryStrategy: text("discovery_strategy").notNull().$type<DiscoveryStrategy>(),
  progressJson: text("progress_json", { mode: "json" }).notNull().$type<CheckProgressDto>(),
  resultJson: text("result_json", { mode: "json" }).$type<CheckResultDto | null>(),
  errorJson: text("error_json", { mode: "json" }).$type<CheckApiErrorDto | null>(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  completedAt: text("completed_at"),
});
