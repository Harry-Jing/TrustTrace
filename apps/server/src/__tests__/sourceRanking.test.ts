import { describe, expect, it } from "bun:test";

import {
  authorityScoreForUrl,
  rankDiscoveredSources,
  selectBestEvidenceByDomain,
} from "../sources/ranking";
import type { SourceExtractionRecordDto } from "../types/sources";

describe("source authority ranking", () => {
  it("boosts official and academic sources above generic pages", () => {
    expect(authorityScoreForUrl("https://cdc.gov/report/flu", "Official report")).toBeGreaterThan(
      authorityScoreForUrl("https://example-news.test/story", "News story"),
    );
    expect(
      rankDiscoveredSources([
        { url: "https://example-news.test/story", title: "News story" },
        { url: "https://agency.gov/report", title: "Agency report" },
      ])[0]?.url,
    ).toBe("https://agency.gov/report");
  });

  it("keeps only the highest-scored source per domain after verification", () => {
    const selected = selectBestEvidenceByDomain(
      [
        source("https://same.test/snippet", "same.test", 1, "snippet_only"),
        source("https://same.test/full", "same.test", 2, "fetched"),
        source("https://other.gov/report", "other.gov", 3, "fetched"),
      ],
      6,
    );

    expect(selected.map((item) => item.resolvedUrl)).toEqual([
      "https://other.gov/report",
      "https://same.test/full",
    ]);
  });
});

function source(
  url: string,
  domain: string,
  discoveryRank: number,
  verificationStatus: SourceExtractionRecordDto["verificationStatus"],
): SourceExtractionRecordDto {
  return {
    id: `src-${discoveryRank}`,
    checkId: "check-1",
    candidateUrl: url,
    resolvedUrl: url,
    domain,
    title: `${domain} source`,
    discoverySnippet:
      verificationStatus === "snippet_only" ? "Snippet context for the source." : null,
    discoveryProvider: "test",
    discoveryRank,
    verificationStatus,
    httpStatus: verificationStatus === "fetched" ? 200 : null,
    contentType: verificationStatus === "fetched" ? "text/html" : null,
    contentHash: verificationStatus === "fetched" ? "a".repeat(64) : null,
    extractionMethod: verificationStatus === "snippet_only" ? "snippet_only" : "html_basic",
    extractedText: verificationStatus === "fetched" ? "Full extracted source text." : null,
    textExcerpt:
      verificationStatus === "fetched"
        ? "Full extracted source text with enough detail for ranking."
        : "Snippet context for the source.",
    failureCode: null,
    failureMessage: null,
    createdAt: "2026-04-27T00:00:00.000Z",
    updatedAt: "2026-04-27T00:00:01.000Z",
  };
}
