import { afterEach, describe, expect, it } from "bun:test";

import { cleanupTestContexts, createTestContext } from "./helpers/context";
import { FakeDiscoveryProvider } from "./helpers/fakeEvidenceProvider";
import { TavilyDiscoveryProvider } from "../sourceDiscovery/TavilyDiscoveryProvider";
import { createCheck, getRecord } from "./helpers/requests";

afterEach(cleanupTestContexts);

describe("TrustTrace provider configuration", () => {
  it("fails checks with provider configuration errors when no OpenAI key is configured", async () => {
    const { services } = createTestContext({ evidenceProvider: null, openAiApiKey: null });
    const created = await createCheck(services, "A claim that needs OpenAI configuration");

    await services.pipeline.waitForIdle();

    const record = await getRecord(services, created.checkId);

    expect(record.status).toBe("failed");
    expect(record.error?.code).toBe("PROVIDER_CONFIGURATION_ERROR");
    expect(record.error?.retryable).toBe(false);
    expect(record.result).toBeNull();
  });

  it("fails search API discovery checks when no Tavily key is configured", async () => {
    const { services } = createTestContext({
      discoveryProviders: {
        search_api: new TavilyDiscoveryProvider({ apiKey: null }),
        llm_web: new FakeDiscoveryProvider(),
      },
    });
    const created = await createCheck(services, "A claim that needs Tavily discovery");

    await services.pipeline.waitForIdle();

    const record = await getRecord(services, created.checkId);

    expect(record.status).toBe("failed");
    expect(record.error?.code).toBe("PROVIDER_CONFIGURATION_ERROR");
    expect(record.error?.retryable).toBe(false);
    expect(record.result).toBeNull();
  });
});
