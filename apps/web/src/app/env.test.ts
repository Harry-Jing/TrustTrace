import { describe, expect, it } from "vitest";

import { readApiMode } from "@/app/env";

describe("readApiMode", () => {
  it("accepts mock and backend modes", () => {
    expect(readApiMode("mock")).toBe("mock");
    expect(readApiMode("backend")).toBe("backend");
  });

  it("rejects unsupported legacy mode names", () => {
    expect(() => readApiMode("real")).toThrow("VITE_TRUSTTRACE_API_MODE");
  });
});
