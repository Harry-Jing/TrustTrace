import { afterEach, describe, expect, it } from "bun:test";

import { cleanupTestContexts, createTestContext } from "./helpers/context";
import { createCheck, parseProgressEvents, responseText } from "./helpers/requests";
import { sleep } from "./helpers/timing";

afterEach(cleanupTestContexts);

describe("TrustTrace server API", () => {
  it("creates a running check and returns the persisted record", async () => {
    const { services } = createTestContext({ pipelineDelayMs: 25 });

    const created = await createCheck(services, "A claim worth checking");

    expect(created.status).toBe("running");
    expect(created.progress.phase).toBe("understanding");
    expect(created.eventsUrl).toBe(`/v1/checks/${created.checkId}/events`);

    const recordResponse = await services.app.request(`/v1/checks/${created.checkId}`);
    const record = (await recordResponse.json()) as Record<string, unknown>;

    expect(recordResponse.status).toBe(200);
    expect(record.checkId).toBe(created.checkId);
    expect(record.discoveryStrategy).toBe("search_api");
    expect(record.input).toEqual({ type: "text", content: "A claim worth checking" });
    expect(record.createdAt).toBe(created.createdAt);
  });

  it("lists recent checks with limit and offset", async () => {
    const { services } = createTestContext({ pipelineDelayMs: 25 });

    const first = await createCheck(services, "First claim");
    await sleep(5);
    const second = await createCheck(services, "Second claim");

    const firstPageResponse = await services.app.request("/v1/checks?limit=1");
    const firstPage = (await firstPageResponse.json()) as {
      items: Array<{ checkId: string; claim: string }>;
    };

    expect(firstPageResponse.status).toBe(200);
    expect(firstPage.items).toHaveLength(1);
    expect(firstPage.items[0]?.checkId).toBe(second.checkId);
    expect(firstPage.items[0]?.claim).toBe("Second claim");

    const secondPageResponse = await services.app.request("/v1/checks?limit=1&offset=1");
    const secondPage = (await secondPageResponse.json()) as {
      items: Array<{ checkId: string; claim: string }>;
    };

    expect(secondPage.items).toHaveLength(1);
    expect(secondPage.items[0]?.checkId).toBe(first.checkId);
    expect(secondPage.items[0]?.claim).toBe("First claim");
  });

  it("rejects invalid text and URL submissions", async () => {
    const { services } = createTestContext();

    const shortText = await services.app.request("/v1/checks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: { type: "text", content: "no" },
        discoveryStrategy: "search_api",
      }),
    });
    const unsafeUrl = await services.app.request("/v1/checks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: { type: "url", content: "javascript:alert(1)" },
        discoveryStrategy: "search_api",
      }),
    });

    const missingStrategy = await services.app.request("/v1/checks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: { type: "text", content: "A valid claim" } }),
    });
    const invalidStrategy = await services.app.request("/v1/checks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: { type: "text", content: "A valid claim" },
        discoveryStrategy: "auto",
      }),
    });
    const missingStrategyBody = (await missingStrategy.json()) as Record<string, unknown>;
    const invalidStrategyBody = (await invalidStrategy.json()) as Record<string, unknown>;

    expect(shortText.status).toBe(400);
    expect(unsafeUrl.status).toBe(400);
    expect(missingStrategy.status).toBe(400);
    expect(missingStrategyBody.code).toBe("INVALID_CHECK_INPUT");
    expect(invalidStrategy.status).toBe(400);
    expect(invalidStrategyBody.code).toBe("INVALID_CHECK_INPUT");
  });

  it("returns 404 JSON for unknown check ids", async () => {
    const { services } = createTestContext();

    const response = await services.app.request("/v1/checks/missing-check");
    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(404);
    expect(body.code).toBe("CHECK_NOT_FOUND");
  });

  it("streams progress events and supports afterSeq replay", async () => {
    const { services } = createTestContext({ pipelineDelayMs: 1 });
    const created = await createCheck(services, "A streamed claim");

    const streamResponse = await services.app.request(
      `/v1/checks/${created.checkId}/events?afterSeq=1`,
    );
    const streamText = await responseText(streamResponse);
    const streamedEvents = parseProgressEvents(streamText);

    expect(streamResponse.status).toBe(200);
    expect(streamResponse.headers.get("content-type")).toContain("text/event-stream");
    expect(streamedEvents.every((event) => event.seq > 1)).toBe(true);
    expect(streamedEvents.at(-1)?.status).toBe("completed");

    const replayResponse = await services.app.request(
      `/v1/checks/${created.checkId}/events?afterSeq=6`,
    );
    const replayEvents = parseProgressEvents(await responseText(replayResponse));

    expect(replayEvents.map((event) => event.seq)).toEqual([7]);
    expect(replayEvents[0]?.phase).toBe("completed");
  });
});
