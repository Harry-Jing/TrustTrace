import { describe, expect, it } from "bun:test";

import { readConfig } from "../config";

describe("server config", () => {
  it("uses safe defaults and normalizes the log level", () => {
    const config = readConfig({ TRUSTTRACE_LOG_LEVEL: "DEBUG" });

    expect(config.port).toBe(8000);
    expect(config.dbPath.endsWith("apps/server/data/trusttrace.sqlite")).toBe(true);
    expect(config.logLevel).toBe("debug");
    expect(config.openAiApiKey).toBeNull();
    expect(config.openAiModel).toBe("gpt-5.5");
    expect(config.openAiReasoningEffort).toBe("low");
  });

  it("rejects unsupported log levels", () => {
    expect(() => readConfig({ TRUSTTRACE_LOG_LEVEL: "verbose" })).toThrow(/TRUSTTRACE_LOG_LEVEL/);
  });
});
