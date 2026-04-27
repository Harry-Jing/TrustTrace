import { describe, expect, it } from "bun:test";

import type { SourceAssessment } from "../evidenceProvider";
import { buildEvidenceResult } from "../synthesis";
import type { CheckRecordDto, SourceExtractionRecordDto } from "../types";

describe("deterministic evidence synthesis", () => {
  it("selects strong, mixed, thin, and needs-context bands from backend rules", () => {
    expect(
      buildEvidenceResult({
        record: record(),
        extractions: [
          source("https://one.test/a", "one.test"),
          source("https://two.test/a", "two.test"),
        ],
        assessments: [
          assessment("https://one.test/a", "supports", 0.9),
          assessment("https://two.test/a", "supports", 0.8),
        ],
        completedAt: "2026-04-27T00:00:05.000Z",
        maxEvidenceSources: 6,
      }).verdictBand,
    ).toBe("evidence_strong");

    expect(
      buildEvidenceResult({
        record: record(),
        extractions: [
          source("https://one.test/a", "one.test"),
          source("https://two.test/a", "two.test"),
        ],
        assessments: [
          assessment("https://one.test/a", "supports", 0.8),
          assessment("https://two.test/a", "contradicts", 0.8),
        ],
        completedAt: "2026-04-27T00:00:05.000Z",
        maxEvidenceSources: 6,
      }).verdictBand,
    ).toBe("evidence_mixed");

    expect(
      buildEvidenceResult({
        record: record(),
        extractions: [source("https://one.test/a", "one.test")],
        assessments: [assessment("https://one.test/a", "supports", 0.2)],
        completedAt: "2026-04-27T00:00:05.000Z",
        maxEvidenceSources: 6,
      }).verdictBand,
    ).toBe("evidence_thin");

    expect(
      buildEvidenceResult({
        record: record(),
        extractions: [source("https://one.test/a", "one.test")],
        assessments: [assessment("https://one.test/a", "neutral", 0.2)],
        completedAt: "2026-04-27T00:00:05.000Z",
        maxEvidenceSources: 6,
      }).verdictBand,
    ).toBe("needs_context");
  });
});

function record(): CheckRecordDto {
  return {
    checkId: "check-1",
    status: "running",
    input: { type: "text", content: "A claim" },
    progress: {
      checkId: "check-1",
      status: "running",
      phase: "weigh",
      percent: 80,
      message: "Weighing.",
      eventSeq: 5,
      updatedAt: "2026-04-27T00:00:04.000Z",
    },
    result: null,
    error: null,
    createdAt: "2026-04-27T00:00:00.000Z",
    updatedAt: "2026-04-27T00:00:04.000Z",
    completedAt: null,
  };
}

function source(url: string, domain: string): SourceExtractionRecordDto {
  return {
    id: `src-${domain}`,
    checkId: "check-1",
    candidateUrl: url,
    resolvedUrl: url,
    domain,
    title: `${domain} title`,
    discoveryProvider: "test",
    discoveryRank: 1,
    verificationStatus: "fetched",
    httpStatus: 200,
    contentType: "text/html",
    contentHash: "a".repeat(64),
    extractionMethod: "html_basic",
    extractedText:
      "Extracted source text that is long enough to evaluate the claim in a deterministic unit test.",
    textExcerpt:
      "Extracted source text that is long enough to evaluate the claim in a deterministic unit test.",
    failureCode: null,
    failureMessage: null,
    createdAt: "2026-04-27T00:00:01.000Z",
    updatedAt: "2026-04-27T00:00:02.000Z",
  };
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
