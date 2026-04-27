import { describe, expect, it } from "bun:test";

import {
  checkListResponseSchema,
  createCheckRequestSchema,
  progressEventSchema,
} from "../src/checks";

describe("checks API contracts", () => {
  it("trims and validates create-check requests", () => {
    expect(
      createCheckRequestSchema.parse({ input: { type: "text", content: "  A checkable claim  " } }),
    ).toEqual({ input: { type: "text", content: "A checkable claim" } });

    expect(() =>
      createCheckRequestSchema.parse({ input: { type: "url", content: "javascript:alert(1)" } }),
    ).toThrow("URL checks must use an absolute http(s) URL.");
  });

  it("keeps the check-list response shape explicit", () => {
    expect(checkListResponseSchema.parse({ items: [] })).toEqual({ items: [] });
    expect(() => checkListResponseSchema.parse([])).toThrow();
  });

  it("normalizes optional SSE fields to null", () => {
    expect(
      progressEventSchema.parse({
        seq: 1,
        checkId: "check-1",
        status: "running",
        phase: "discovery",
        percent: 40,
        message: "Searching sources.",
        createdAt: "2026-04-27T20:00:00.000Z",
      }),
    ).toMatchObject({ provider: null, stepCode: null, error: null });
  });
});
