import { afterEach, describe, expect, it } from "bun:test";

import { cleanupTestContexts, createTestContext } from "./helpers/context";
import { assessment, FakeEvidenceProvider } from "./helpers/fakeEvidenceProvider";
import { fakeSourceFetchOptions } from "./helpers/fakeSourceFetch";
import { createCheck, createUrlCheck, getRecord } from "./helpers/requests";

afterEach(cleanupTestContexts);

describe("TrustTrace evidence pipeline integration", () => {
  it("completes with persisted verified source evidence", async () => {
    const { services } = createTestContext();
    const created = await createCheck(services, "Independent sources support this claim");

    await services.pipeline.waitForIdle();

    const record = await getRecord(services, created.checkId);
    const extractions = services.repository.listSourceExtractions(created.checkId);
    const claimAnalysis = services.repository.getClaimAnalysis(created.checkId);
    const providerCalls = services.repository.listProviderCalls(created.checkId);
    const evaluations = services.repository.listSourceEvaluations(created.checkId);

    expect(record.status).toBe("completed");
    expect(record.result?.evidence[0]?.url).toBe("https://source.test/article");
    expect(record.result?.evidence[0]?.relation).toBe("supports");
    expect(claimAnalysis?.mainClaim).toBe("Independent sources support this claim");
    expect(providerCalls.map((call) => call.operation)).toEqual([
      "claim_analysis",
      "source_discovery",
      "source_assessment",
      "result_copy",
    ]);
    expect(evaluations[0]?.relation).toBe("supports");
    expect(extractions).toHaveLength(1);
    expect(extractions[0]?.verificationStatus).toBe("fetched");
    expect(extractions[0]?.contentHash).toBeTruthy();
  });

  it("extracts URL inputs before discovery without turning the submitted URL into evidence", async () => {
    const { services } = createTestContext();
    const created = await createUrlCheck(services, "https://submitted.test/story");

    await services.pipeline.waitForIdle();

    const record = await getRecord(services, created.checkId);
    const inputExtractions = services.repository.listInputExtractions(created.checkId);
    const evidenceUrls = record.result?.evidence.map((item) => item.url) ?? [];

    expect(record.status).toBe("completed");
    expect(inputExtractions[0]?.resolvedUrl).toBe("https://submitted.test/story");
    expect(evidenceUrls).toEqual(["https://source.test/article"]);
    expect(evidenceUrls).not.toContain("https://submitted.test/story");
  });

  it("does not turn unsafe discovered URLs into evidence", async () => {
    const { services } = createTestContext({
      evidenceProvider: new FakeEvidenceProvider({
        candidates: [{ url: "http://127.0.0.1/private", title: "Unsafe local URL" }],
      }),
    });
    const created = await createCheck(services, "A claim with unsafe search results");

    await services.pipeline.waitForIdle();

    const record = await getRecord(services, created.checkId);
    const extractions = services.repository.listSourceExtractions(created.checkId);

    expect(record.status).toBe("failed");
    expect(record.error?.code).toBe("SOURCE_EXTRACTION_FAILED");
    expect(record.result).toBeNull();
    expect(extractions[0]?.verificationStatus).toBe("blocked");
    expect(extractions[0]?.failureCode).toBe("UNSAFE_IP_ADDRESS");
  });

  it("deduplicates same-domain sources before assessment", async () => {
    const provider = new FakeEvidenceProvider({
      candidates: [
        { url: "https://same.test/first", title: "Same source" },
        { url: "https://same.test/second", title: "Same source duplicate" },
        { url: "https://agency.gov/report", title: "Agency report" },
      ],
    });
    const { services } = createTestContext({ evidenceProvider: provider });
    const created = await createCheck(services, "A same-domain dedupe claim");

    await services.pipeline.waitForIdle();

    expect(provider.assessedSources.map((source) => source.domain).sort()).toEqual([
      "agency.gov",
      "same.test",
    ]);
    expect(services.repository.listSourceExtractions(created.checkId)).toHaveLength(3);
  });

  it("keeps snippet-only context from producing a strong evidence band", async () => {
    const provider = new FakeEvidenceProvider({
      candidates: [
        {
          url: "https://snippet-one.test/article",
          title: "Snippet one",
          snippet: "Snippet one directly says the checked claim is supported by public evidence.",
        },
        {
          url: "https://snippet-two.test/article",
          title: "Snippet two",
          snippet:
            "Snippet two independently says the checked claim is supported by public evidence.",
        },
      ],
      assessments: [
        assessment("https://snippet-one.test/article", "supports", 0.95),
        assessment("https://snippet-two.test/article", "supports", 0.92),
      ],
    });
    const { services } = createTestContext({
      evidenceProvider: provider,
      sourceFetchOptions: fakeSourceFetchOptions({
        fetch: async () => new Response("not found", { status: 404 }),
      }),
    });
    const created = await createCheck(services, "A claim supported only by snippets");

    await services.pipeline.waitForIdle();

    const record = await getRecord(services, created.checkId);

    expect(record.status).toBe("completed");
    expect(record.result?.verdictBand).not.toBe("evidence_strong");
    expect(record.result?.atAGlance.fullText).toBe(0);
    expect(record.result?.atAGlance.snippet).toBe(2);
    expect(record.result?.evidence.every((item) => item.tier === 4)).toBe(true);
  });

  it("uses deterministic result copy when LLM copy generation fails", async () => {
    const { services } = createTestContext({
      evidenceProvider: new FakeEvidenceProvider({ failResultCopy: true }),
    });
    const created = await createCheck(services, "A claim with fallback copy");

    await services.pipeline.waitForIdle();

    const record = await getRecord(services, created.checkId);
    const resultCopyCall = services.repository
      .listProviderCalls(created.checkId)
      .find((call) => call.operation === "result_copy");

    expect(record.status).toBe("completed");
    expect(record.result?.headline).toBe(
      "Some verified evidence is relevant, but it is not decisive.",
    );
    expect(resultCopyCall?.status).toBe("failed");
  });
});
