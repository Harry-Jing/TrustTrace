import { describe, expect, it } from "bun:test";

import {
  checkApiErrorSchema,
  checkListResponseSchema,
  createCheckRequestSchema,
  progressEventSchema,
  VERDICT_BAND_ORDER,
  VERDICT_BANDS,
} from "../src/checks";

describe("checks API contracts", () => {
  it("trims and validates create-check requests", () => {
    expect(
      createCheckRequestSchema.parse({
        input: { type: "text", content: "  A checkable claim  " },
        discoveryStrategy: "search_api",
      }),
    ).toEqual({
      input: { type: "text", content: "A checkable claim" },
      discoveryStrategy: "search_api",
    });

    expect(() =>
      createCheckRequestSchema.parse({
        input: { type: "url", content: "javascript:alert(1)" },
        discoveryStrategy: "llm_web",
      }),
    ).toThrow("URL checks must use an absolute http(s) URL.");

    expect(() =>
      createCheckRequestSchema.parse({ input: { type: "text", content: "A valid claim" } }),
    ).toThrow();

    expect(() =>
      createCheckRequestSchema.parse({
        input: { type: "text", content: "A valid claim" },
        discoveryStrategy: "auto",
      }),
    ).toThrow();
  });

  it("keeps the check-list response shape explicit", () => {
    expect(checkListResponseSchema.parse({ items: [] })).toEqual({ items: [] });
    expect(() => checkListResponseSchema.parse([])).toThrow();
  });

  it("strips presentation tokens from list items so the wire stays data-only", () => {
    // `tone` was a presentation token that briefly lived on the wire and
    // is now derived client-side from `verdictBand`. The contract must
    // not silently re-admit it: any extra keys are dropped during parse.
    const parsed = checkListResponseSchema.parse({
      items: [
        {
          checkId: "check-1",
          claim: "A claim",
          snippet: "A short snippet",
          createdAt: "2026-04-27T20:00:00.000Z",
          cue: "evidence strong",
          verdictBand: "evidence_strong",
          tone: "accent",
        },
      ],
    });
    expect(parsed.items[0]).not.toHaveProperty("tone");
  });

  it("keeps verdict-band sort order aligned with the verdict-band schema source", () => {
    expect(VERDICT_BAND_ORDER).toEqual(VERDICT_BANDS);
  });

  it("allowlists persisted check error codes", () => {
    const baseError = {
      category: "provider",
      message: "The provider took too long.",
      retryable: true,
      traceId: null,
      occurredAt: "2026-04-27T20:00:00.000Z",
    };

    expect(checkApiErrorSchema.parse({ ...baseError, code: "PROVIDER_TIMEOUT" }).code).toBe(
      "PROVIDER_TIMEOUT",
    );
    expect(() =>
      checkApiErrorSchema.parse({ ...baseError, code: "CLAIM_ANALYSIS_EMPTY" }),
    ).toThrow();
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
