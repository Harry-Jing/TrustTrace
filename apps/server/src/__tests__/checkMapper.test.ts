import { describe, expect, it } from "bun:test";

import { rowToListItem } from "../repositories/mappers/checkMapper";
import type { checksTable } from "../schema/checks";
import type { CheckApiErrorDto } from "../types/checks";
import type { CheckResultDto } from "../types/results";

type CheckRow = typeof checksTable.$inferSelect;

function baseRow(overrides: Partial<CheckRow> = {}): CheckRow {
  return {
    id: "check-1",
    status: "running",
    inputJson: { type: "text", content: "A claim worth checking" },
    discoveryStrategy: "search_api",
    progressJson: {
      checkId: "check-1",
      status: "running",
      phase: "understanding",
      percent: 8,
      message: "Reading the input.",
      eventSeq: 1,
      updatedAt: "2026-04-27T00:00:00.000Z",
    },
    resultJson: null,
    errorJson: null,
    createdAt: "2026-04-27T00:00:00.000Z",
    updatedAt: "2026-04-27T00:00:00.000Z",
    completedAt: null,
    ...overrides,
  };
}

function completedRow(verdictBand: CheckResultDto["verdictBand"], verdictLabel: string): CheckRow {
  const result: CheckResultDto = {
    checkId: "check-1",
    inputText: "A claim worth checking",
    inputTypeLabel: "text input",
    durationLabel: "5.0s",
    verdictBand,
    verdictLabel,
    headline: "headline",
    description: "description",
    atAGlance: {
      evidence: 1,
      independent: 1,
      fullText: 1,
      primary: 0,
      snippet: 0,
      uncertainty: "low",
    },
    cues: [],
    evidence: [],
    uncertaintyLines: [],
    noteText: "note",
    summaryText: "summary",
  };
  return baseRow({
    status: "completed",
    resultJson: result,
    completedAt: "2026-04-27T00:00:05.000Z",
  });
}

function failedRow(message: string): CheckRow {
  const error: CheckApiErrorDto = {
    code: "PIPELINE_ERROR",
    category: "pipeline",
    message,
    retryable: false,
    traceId: null,
    occurredAt: "2026-04-27T00:00:05.000Z",
  };
  return baseRow({
    status: "failed",
    errorJson: error,
    completedAt: "2026-04-27T00:00:05.000Z",
  });
}

describe("rowToListItem", () => {
  it("maps a queued/running row to a verdict-less list item", () => {
    const item = rowToListItem(baseRow());
    expect(item.checkId).toBe("check-1");
    expect(item.cue).toBe("checking");
    expect(item.verdictBand).toBeNull();
    expect(item.snippet).toContain("evidence pipeline");
    expect(item).not.toHaveProperty("tone");
  });

  it.each([
    ["evidence_strong", "evidence strong"],
    ["evidence_mixed", "mixed evidence"],
    ["evidence_weak", "weak evidence"],
    ["evidence_thin", "thin evidence"],
    ["needs_context", "needs context"],
  ] as const)("maps a completed %s row to its band and label", (band, label) => {
    const item = rowToListItem(completedRow(band, label));
    expect(item.verdictBand).toBe(band);
    expect(item.cue).toBe(label);
    expect(item).not.toHaveProperty("tone");
  });

  it("maps a failed row to the system_failed band", () => {
    const item = rowToListItem(failedRow("Pipeline crashed"));
    expect(item.verdictBand).toBe("system_failed");
    expect(item.cue).toBe("failed");
    expect(item.snippet).toBe("Pipeline crashed");
    expect(item).not.toHaveProperty("tone");
  });
});
