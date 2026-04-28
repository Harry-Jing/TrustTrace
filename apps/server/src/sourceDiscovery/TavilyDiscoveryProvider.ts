import { tavily } from "@tavily/core";

import { EvidenceProviderError } from "../evidenceProvider/types";
import { providerError } from "../evidenceProvider/openaiErrors";
import { dedupeSources } from "./responseSources";
import type {
  DiscoveredSource,
  DiscoveryInput,
  DiscoveryProviderMetadata,
  SourceDiscoveryProvider,
} from "./types";

interface TavilyDiscoveryProviderOptions {
  apiKey: string | null;
  client?: TavilySearchClient;
}

interface TavilySearchOptions {
  searchDepth: "basic";
  includeAnswer: false;
  includeRawContent: false;
  includeImages: false;
  maxResults: number;
}

export interface TavilySearchClient {
  search(query: string, options: TavilySearchOptions): Promise<TavilySearchResponse>;
}

interface TavilySearchResponse {
  results?: TavilySearchResult[];
}

interface TavilySearchResult {
  title?: unknown;
  url?: unknown;
  content?: unknown;
}

export class TavilyDiscoveryProvider implements SourceDiscoveryProvider {
  readonly metadata: DiscoveryProviderMetadata = {
    provider: "tavily:search",
    model: "tavily-search-basic",
  };

  private readonly client: TavilySearchClient | null;

  constructor(options: TavilyDiscoveryProviderOptions) {
    this.client = options.client ?? (options.apiKey ? tavily({ apiKey: options.apiKey }) : null);
  }

  async discoverSources(input: DiscoveryInput, maxCandidates: number): Promise<DiscoveredSource[]> {
    const client = this.requireClient();
    const queries = discoveryQueries(input);
    const maxResults = Math.min(20, Math.ceil(maxCandidates / queries.length) + 2);
    const discovered: DiscoveredSource[] = [];

    try {
      for (const query of queries) {
        const response = await client.search(query, {
          searchDepth: "basic",
          includeAnswer: false,
          includeRawContent: false,
          includeImages: false,
          maxResults,
        });
        discovered.push(...sourcesFromResponse(response));
      }

      return dedupeSources(discovered).slice(0, maxCandidates);
    } catch (error) {
      throw providerError(error, "SOURCE_DISCOVERY_FAILED", "Tavily source discovery failed.");
    }
  }

  private requireClient(): TavilySearchClient {
    if (!this.client) {
      throw new EvidenceProviderError(
        "PROVIDER_CONFIGURATION_ERROR",
        "TAVILY_API_KEY is required to run search API discovery checks.",
      );
    }
    return this.client;
  }
}

function discoveryQueries(input: DiscoveryInput): string[] {
  const candidates = [
    input.claimAnalysis.queryPlan.neutral[0],
    input.claimAnalysis.queryPlan.authority[0],
    input.claimAnalysis.queryPlan.challenge[0],
  ];
  const queries = uniqueNonEmpty(candidates);
  return queries.length > 0 ? queries : [input.claimAnalysis.mainClaim];
}

function uniqueNonEmpty(values: readonly (string | undefined)[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const query = value?.replace(/\s+/g, " ").trim();
    if (!query) continue;
    const key = query.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(query);
  }

  return result;
}

function sourcesFromResponse(response: TavilySearchResponse): DiscoveredSource[] {
  return (response.results ?? [])
    .map((result): DiscoveredSource | null => {
      const url = readString(result.url);
      if (!url) return null;
      return {
        url,
        title: readString(result.title),
        snippet: readString(result.content) ?? null,
      } satisfies DiscoveredSource;
    })
    .filter((source): source is DiscoveredSource => source !== null);
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
