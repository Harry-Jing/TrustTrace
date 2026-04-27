import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getCheck,
  listChecks,
  subscribeCheckEvents,
} from "@/features/checks/api/backendChecksClient";

class MockEventSource {
  static instances: MockEventSource[] = [];

  readonly url: string | URL;
  onmessage: ((event: MessageEvent<string>) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  readonly close = vi.fn<() => void>();
  private readonly listeners = new Map<string, Array<(event: MessageEvent<string>) => void>>();

  constructor(url: string | URL) {
    this.url = url;
    MockEventSource.instances.push(this);
  }

  addEventListener(type: string, listener: EventListenerOrEventListenerObject) {
    const eventListener =
      typeof listener === "function"
        ? (listener as (event: MessageEvent<string>) => void)
        : (event: MessageEvent<string>) => {
            listener.handleEvent(event);
          };
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), eventListener]);
  }

  emitProgress(data: Record<string, unknown>) {
    this.emitRaw(JSON.stringify(data));
  }

  emitRaw(data: string) {
    const event = new MessageEvent<string>("progress", { data });
    this.listeners.get("progress")?.forEach((listener) => {
      listener(event);
    });
  }

  fail() {
    this.onerror?.(new Event("error"));
  }
}

describe("backendChecksClient subscribeCheckEvents", () => {
  const originalEventSource = globalThis.EventSource;

  beforeEach(() => {
    MockEventSource.instances = [];
    globalThis.EventSource = MockEventSource as unknown as typeof EventSource;
  });

  afterEach(() => {
    vi.useRealTimers();
    globalThis.EventSource = originalEventSource;
  });

  it("uses the supplied eventsUrl and resumes transient reconnects after the last event seq", async () => {
    vi.useFakeTimers();
    const onError = vi.fn<(error: unknown) => void>();
    const onEvent = vi.fn<(event: unknown) => void>();

    subscribeCheckEvents("check-1", { onEvent, onError }, { eventsUrl: "/v1/custom/events" });

    expect(String(MockEventSource.instances[0]!.url)).toBe("/v1/custom/events");

    MockEventSource.instances[0]!.emitProgress({
      seq: 7,
      checkId: "check-1",
      status: "running",
      phase: "discovery",
      percent: 35,
      message: "Analyzing sources.",
      createdAt: "2026-04-23T12:00:00.000Z",
    });
    MockEventSource.instances[0]!.fail();

    expect(onError).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(500);

    expect(String(MockEventSource.instances[1]!.url)).toBe("/v1/custom/events?afterSeq=7");
  });

  it("reports a stream error only after reconnect attempts are exhausted", async () => {
    vi.useFakeTimers();
    const onError = vi.fn<(error: unknown) => void>();
    const onClose = vi.fn<() => void>();

    subscribeCheckEvents(
      "check-1",
      { onError, onClose },
      { eventsUrl: "/v1/checks/check-1/events" },
    );

    MockEventSource.instances[0]!.fail();
    await vi.advanceTimersByTimeAsync(500);
    MockEventSource.instances[1]!.fail();
    await vi.advanceTimersByTimeAsync(1000);
    MockEventSource.instances[2]!.fail();
    await vi.advanceTimersByTimeAsync(2000);

    expect(onError).not.toHaveBeenCalled();

    MockEventSource.instances[3]!.fail();

    expect(onError).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("ignores duplicate or stale progress events", () => {
    const onEvent = vi.fn<(event: unknown) => void>();

    subscribeCheckEvents("check-1", { onEvent }, { eventsUrl: "/v1/checks/check-1/events" });

    MockEventSource.instances[0]!.emitProgress({
      seq: 2,
      checkId: "check-1",
      status: "running",
      phase: "discovery",
      percent: 40,
      message: "Analyzing sources.",
      createdAt: "2026-04-23T12:00:00.000Z",
    });
    MockEventSource.instances[0]!.emitProgress({
      seq: 1,
      checkId: "check-1",
      status: "running",
      phase: "understanding",
      percent: 8,
      message: "Reading the input.",
      createdAt: "2026-04-23T11:59:59.000Z",
    });
    MockEventSource.instances[0]!.emitProgress({
      seq: 2,
      checkId: "check-1",
      status: "running",
      phase: "discovery",
      percent: 40,
      message: "Analyzing sources.",
      createdAt: "2026-04-23T12:00:00.000Z",
    });

    expect(onEvent).toHaveBeenCalledOnce();
  });

  it("reports invalid progress event payloads instead of coercing them", () => {
    const onError = vi.fn<(error: unknown) => void>();
    const onEvent = vi.fn<(event: unknown) => void>();

    subscribeCheckEvents(
      "check-1",
      { onEvent, onError },
      { eventsUrl: "/v1/checks/check-1/events" },
    );

    MockEventSource.instances[0]!.emitProgress({
      seq: 1,
      checkId: "check-1",
      status: "neon",
      phase: "discovery",
      percent: 40,
      message: "Analyzing sources.",
      createdAt: "2026-04-23T12:00:00.000Z",
    });

    expect(onEvent).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledOnce();
    expect(onError.mock.calls[0]![0]).toBeInstanceOf(Error);
  });
});

describe("backendChecksClient response contracts", () => {
  const originalFetch = globalThis.fetch;
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    globalThis.fetch = fetchMock;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  function jsonResponse(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }

  function makeProgress() {
    return {
      checkId: "check-1",
      status: "completed",
      phase: "completed",
      percent: 100,
      message: "Check complete.",
      eventSeq: 10,
      updatedAt: "2026-04-23T12:00:00.000Z",
    };
  }

  function makeEvidence(overrides: Record<string, unknown> = {}) {
    return {
      sourceName: "nhtsa.gov",
      domain: "nhtsa.gov",
      credibilityLabel: "GOV",
      date: "2025",
      title: "Facts About Seat Belt Use",
      text: "Seat belts reduce serious injury in crashes.",
      url: "https://www.nhtsa.gov/vehicle-safety/seat-belts",
      relation: "supports",
      tier: 1,
      scopeMatch: 0.95,
      ...overrides,
    };
  }

  function makeResult(overrides: Record<string, unknown> = {}) {
    return {
      checkId: "check-1",
      inputText: "Seat belts reduce serious injury in crashes",
      inputTypeLabel: "text input",
      durationLabel: "7.8s",
      verdictBand: "evidence_strong",
      verdictLabel: "evidence strong",
      headline: "Strong evidence stacks at the top of the ladder.",
      description: "Multiple verified sources support the claim.",
      atAGlance: {
        evidence: 1,
        independent: 1,
        fullText: 1,
        primary: 1,
        snippet: 0,
        uncertainty: "low",
      },
      cues: [
        {
          name: "Cross-source consistency",
          text: "Sources align.",
          note: "Independent agreement matters.",
          strength: 5,
          tooltip: "Independent sources reduce single-origin bias.",
        },
      ],
      evidence: [makeEvidence()],
      uncertaintyLines: ["Claim scope is broad."],
      noteText: "Read the evidence before sharing.",
      summaryText: "TrustTrace summary",
      ...overrides,
    };
  }

  function makeRecord(overrides: Record<string, unknown> = {}) {
    return {
      checkId: "check-1",
      status: "completed",
      input: { type: "text", content: "Seat belts reduce serious injury in crashes" },
      progress: makeProgress(),
      result: makeResult(),
      error: null,
      createdAt: "2026-04-23T11:59:00.000Z",
      updatedAt: "2026-04-23T12:00:00.000Z",
      completedAt: "2026-04-23T12:00:00.000Z",
      ...overrides,
    };
  }

  it("parses backend records and maps persisted input drafts", async () => {
    fetchMock.mockResolvedValue(jsonResponse(makeRecord()));

    const record = await getCheck("check-1");

    expect(record.input).toEqual({
      mode: "text",
      value: "Seat belts reduce serious injury in crashes",
    });
    expect(record.result?.evidence[0]?.url).toBe("https://www.nhtsa.gov/vehicle-safety/seat-belts");
  });

  it.each([
    ["missing atAGlance", () => makeRecord({ result: makeResult({ atAGlance: undefined }) })],
    [
      "invalid evidence relation",
      () =>
        makeRecord({
          result: makeResult({ evidence: [makeEvidence({ relation: "background" })] }),
        }),
    ],
    [
      "invalid evidence tier",
      () =>
        makeRecord({
          result: makeResult({ evidence: [makeEvidence({ tier: "primary" })] }),
        }),
    ],
    [
      "unsafe evidence URL",
      () =>
        makeRecord({
          result: makeResult({ evidence: [makeEvidence({ url: "javascript:alert(1)" })] }),
        }),
    ],
  ])("rejects completed records with %s", async (_caseName, makeBody) => {
    fetchMock.mockResolvedValue(jsonResponse(makeBody()));

    await expect(getCheck("check-1")).rejects.toThrow(/Backend contract/);
  });

  it("rejects list items with invalid badge tones", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        items: [
          {
            checkId: "check-1",
            claim: "A claim",
            snippet: "A short snippet",
            createdAt: "2026-04-23T12:00:00.000Z",
            cue: "evidence strong",
            tone: "neon",
          },
        ],
      }),
    );

    await expect(listChecks()).rejects.toThrow(/Backend contract/);
  });
});
