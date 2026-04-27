import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "bun:test";
import pino from "pino";

import type {
  ClaimAnalysisInput,
  DiscoveredSource,
  EvidenceProvider,
  ResultCopy,
  ResultCopyInput,
  SourceAssessment,
  SourceForAssessment,
} from "../evidenceProvider";
import { createServices, type TrustTraceServices } from "../services";
import type { FetchLike, SourceFetchOptions } from "../sourceSafety";
import type { CheckRecordDto, CreateCheckResponseDto, ProgressEventDto } from "../types";

interface TestContext {
  services: TrustTraceServices;
  cleanup: () => void;
}

interface TestContextOptions {
  pipelineDelayMs?: number;
  evidenceProvider?: EvidenceProvider | null;
  sourceFetchOptions?: SourceFetchOptions;
  openAiApiKey?: string | null;
}

const contexts: TestContext[] = [];

function createTestContext(options: TestContextOptions = {}): TestContext {
  const dir = mkdtempSync(join(tmpdir(), "trusttrace-server-"));
  const services = createServices({
    dbPath: join(dir, "test.sqlite"),
    pipelineDelayMs: options.pipelineDelayMs ?? 1,
    logger: pino({ level: "silent" }),
    sourceFetchOptions: options.sourceFetchOptions ?? fakeSourceFetchOptions(),
    ...(options.evidenceProvider === null
      ? {}
      : { evidenceProvider: options.evidenceProvider ?? new FakeEvidenceProvider() }),
    ...(options.openAiApiKey === undefined ? {} : { openAiApiKey: options.openAiApiKey }),
  });
  const context = {
    services,
    cleanup: () => rmSync(dir, { recursive: true, force: true }),
  };
  contexts.push(context);
  return context;
}

afterEach(async () => {
  while (contexts.length > 0) {
    const context = contexts.pop();
    if (!context) return;
    await context.services.pipeline.waitForIdle();
    context.services.close();
    context.cleanup();
  }
});

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
      body: JSON.stringify({ input: { type: "text", content: "no" } }),
    });
    const unsafeUrl = await services.app.request("/v1/checks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: { type: "url", content: "javascript:alert(1)" } }),
    });

    expect(shortText.status).toBe(400);
    expect(unsafeUrl.status).toBe(400);
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

async function createCheck(
  services: TrustTraceServices,
  content: string,
): Promise<CreateCheckResponseDto> {
  const response = await services.app.request("/v1/checks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input: { type: "text", content } }),
  });

  expect(response.status).toBe(201);
  return (await response.json()) as CreateCheckResponseDto;
}

async function createUrlCheck(
  services: TrustTraceServices,
  content: string,
): Promise<CreateCheckResponseDto> {
  const response = await services.app.request("/v1/checks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input: { type: "url", content } }),
  });

  expect(response.status).toBe(201);
  return (await response.json()) as CreateCheckResponseDto;
}

async function getRecord(services: TrustTraceServices, checkId: string): Promise<CheckRecordDto> {
  const response = await services.app.request(`/v1/checks/${checkId}`);
  expect(response.status).toBe(200);
  return (await response.json()) as CheckRecordDto;
}

async function responseText(response: Response): Promise<string> {
  return Promise.race([
    response.text(),
    new Promise<string>((_, reject) => {
      setTimeout(() => reject(new Error("Timed out while reading response text.")), 1000);
    }),
  ]);
}

function parseProgressEvents(text: string): ProgressEventDto[] {
  return text
    .split("\n\n")
    .filter(Boolean)
    .map((block) => {
      const dataLine = block.split("\n").find((line) => line.startsWith("data: "));
      if (!dataLine) throw new Error(`Missing SSE data line in block: ${block}`);
      return JSON.parse(dataLine.slice("data: ".length)) as ProgressEventDto;
    });
}

function fakeSourceFetchOptions(overrides: Partial<SourceFetchOptions> = {}): SourceFetchOptions {
  return {
    fetch: fakeFetch,
    resolveHostname: async (hostname) =>
      hostname === "127.0.0.1" ? ["127.0.0.1"] : ["93.184.216.34"],
    timeoutMs: 200,
    maxBytes: 50_000,
    maxRedirects: 3,
    ...overrides,
  };
}

const fakeFetch: FetchLike = async (url) => {
  const hostname = new URL(url).hostname;
  return new Response(
    `<html><head><title>${hostname} source</title></head><body><main>This verified article says independent sources support this claim with enough context for the backend evidence pipeline to evaluate relation and scope. It includes relevant details, background, and direct wording for the submitted claim.</main></body></html>`,
    {
      status: 200,
      headers: { "content-type": "text/html; charset=utf-8" },
    },
  );
};

class FakeEvidenceProvider implements EvidenceProvider {
  readonly metadata = {
    provider: "fake",
    discoveryProvider: "fake:search",
    model: "fake-model",
  };

  private readonly candidates: DiscoveredSource[];
  private readonly assessments: SourceAssessment[];
  private readonly failResultCopy: boolean;
  assessedSources: SourceForAssessment[] = [];

  constructor(
    options: {
      candidates?: DiscoveredSource[];
      assessments?: SourceAssessment[];
      failResultCopy?: boolean;
    } = {},
  ) {
    this.candidates = options.candidates ?? [
      { url: "https://source.test/article", title: "source.test source" },
    ];
    this.failResultCopy = options.failResultCopy ?? false;
    this.assessments =
      options.assessments ??
      this.candidates.map((candidate) => ({
        sourceUrl: candidate.url,
        relation: "supports",
        scopeMatch: 0.82,
        credibilityLabel: "Verified source",
        isPrimary: false,
        rationale: "The excerpt directly discusses the submitted claim.",
        evidenceText: "The verified article directly discusses and supports the submitted claim.",
      }));
  }

  analyzeClaim(input: ClaimAnalysisInput) {
    return Promise.resolve({
      mainClaim: input.extractedTitle ?? input.input.content,
      claimType: "factual" as const,
      domain: "general" as const,
      temporalScope: null,
      geographicScope: null,
      ambiguityNotes: [],
      queryPlan: {
        neutral: [input.input.content],
        authority: [`${input.input.content} official source`],
        challenge: [`${input.input.content} criticism`],
      },
    });
  }

  discoverSources(): Promise<DiscoveredSource[]> {
    return Promise.resolve(this.candidates);
  }

  assessSources(
    _claim: string,
    sources: readonly SourceForAssessment[],
  ): Promise<SourceAssessment[]> {
    this.assessedSources = [...sources];
    const byUrl = new Map(this.assessments.map((assessment) => [assessment.sourceUrl, assessment]));
    return Promise.resolve(
      sources.map(
        (source) =>
          byUrl.get(source.resolvedUrl) ?? {
            sourceUrl: source.resolvedUrl,
            relation: "neutral",
            scopeMatch: 0.2,
            credibilityLabel: "Verified source",
            isPrimary: false,
            rationale: "The excerpt is background context.",
            evidenceText: source.textExcerpt.slice(0, 120),
          },
      ),
    );
  }

  writeResultCopy(input: ResultCopyInput): Promise<ResultCopy> {
    if (this.failResultCopy) return Promise.reject(new Error("result copy failed"));
    return Promise.resolve({
      headline: `Verified sources reviewed ${input.mainClaim}.`,
      description: `Deterministic band ${input.verdictBand} was explained from verified evidence.`,
      uncertaintyLines: [...input.uncertaintyLines],
      noteText: "Copy generated from the verified evidence matrix.",
      summaryText: "Verified evidence matrix reviewed.",
    });
  }
}

function assessment(
  sourceUrl: string,
  relation: SourceAssessment["relation"],
  scopeMatch: number,
): SourceAssessment {
  return {
    sourceUrl,
    relation,
    scopeMatch,
    credibilityLabel: "Verified source",
    isPrimary: false,
    rationale: "Test assessment.",
    evidenceText: "Evidence text from the source excerpt.",
  };
}

function sleep(delayMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}
