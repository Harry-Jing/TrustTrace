import { describe, expect, it } from "bun:test";

import { EvidenceProviderError } from "../evidenceProvider/types";
import {
  TavilyDiscoveryProvider,
  type TavilySearchClient,
} from "../sourceDiscovery/TavilyDiscoveryProvider";
import type { DiscoveryInput } from "../sourceDiscovery/types";

function discoveryInput(overrides: Partial<DiscoveryInput["claimAnalysis"]> = {}): DiscoveryInput {
  return {
    originalInput: { type: "text", content: "Checked claim" },
    claimAnalysis: {
      mainClaim: "Checked claim",
      claimType: "factual",
      domain: "general",
      temporalScope: null,
      geographicScope: null,
      ambiguityNotes: [],
      queryPlan: {
        neutral: ["neutral query"],
        authority: ["authority query"],
        challenge: ["challenge query"],
      },
      ...overrides,
    },
  };
}

describe("TavilyDiscoveryProvider", () => {
  it("runs cost-conscious search fanout and maps results", async () => {
    const calls: Array<{ query: string; options: unknown }> = [];
    const client: TavilySearchClient = {
      async search(query, options) {
        calls.push({ query, options });
        return {
          results: [
            {
              title: `${query} title`,
              url: `https://${query.replace(/\s+/g, "-")}.test/article#section`,
              content: `${query} snippet`,
            },
          ],
        };
      },
    };
    const provider = new TavilyDiscoveryProvider({ apiKey: null, client });

    const sources = await provider.discoverSources(discoveryInput(), 10);

    expect(calls.map((call) => call.query)).toEqual([
      "neutral query",
      "authority query",
      "challenge query",
    ]);
    expect(calls.every((call) => call.options)).toBe(true);
    expect(calls[0]?.options).toEqual({
      searchDepth: "basic",
      includeAnswer: false,
      includeRawContent: false,
      includeImages: false,
      maxResults: 6,
    });
    expect(sources).toEqual([
      {
        url: "https://neutral-query.test/article",
        title: "neutral query title",
        snippet: "neutral query snippet",
      },
      {
        url: "https://authority-query.test/article",
        title: "authority query title",
        snippet: "authority query snippet",
      },
      {
        url: "https://challenge-query.test/article",
        title: "challenge query title",
        snippet: "challenge query snippet",
      },
    ]);
  });

  it("falls back to the main claim when the query plan is empty", async () => {
    const calls: string[] = [];
    const client: TavilySearchClient = {
      async search(query) {
        calls.push(query);
        return { results: [] };
      },
    };
    const provider = new TavilyDiscoveryProvider({ apiKey: null, client });

    await provider.discoverSources(
      discoveryInput({ queryPlan: { neutral: [], authority: [], challenge: [] } }),
      5,
    );

    expect(calls).toEqual(["Checked claim"]);
  });

  it("dedupes duplicate URLs and filters invalid result URLs", async () => {
    const client: TavilySearchClient = {
      async search() {
        return {
          results: [
            { title: "One", url: "https://source.test/page#top", content: "Snippet one" },
            { title: "Duplicate", url: "https://source.test/page", content: "Snippet two" },
            { title: "Invalid", url: "not a url", content: "Bad" },
          ],
        };
      },
    };
    const provider = new TavilyDiscoveryProvider({ apiKey: null, client });

    const sources = await provider.discoverSources(
      discoveryInput({ queryPlan: { neutral: ["same"], authority: ["same"], challenge: [] } }),
      10,
    );

    expect(sources).toEqual([
      { url: "https://source.test/page", title: "One", snippet: "Snippet one" },
    ]);
  });

  it("fails with provider configuration error when no API key or client is configured", async () => {
    const provider = new TavilyDiscoveryProvider({ apiKey: null });

    await expect(provider.discoverSources(discoveryInput(), 10)).rejects.toBeInstanceOf(
      EvidenceProviderError,
    );
    await expect(provider.discoverSources(discoveryInput(), 10)).rejects.toMatchObject({
      code: "PROVIDER_CONFIGURATION_ERROR",
    });
  });
});
