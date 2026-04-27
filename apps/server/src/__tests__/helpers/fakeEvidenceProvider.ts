import type {
  ClaimAnalysisInput,
  DiscoveredSource,
  EvidenceProvider,
  ResultCopy,
  ResultCopyInput,
  SourceAssessment,
  SourceForAssessment,
} from "../../evidenceProvider/types";

export class FakeEvidenceProvider implements EvidenceProvider {
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
    const byUrl = new Map(this.assessments.map((item) => [item.sourceUrl, item]));
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

export function assessment(
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
