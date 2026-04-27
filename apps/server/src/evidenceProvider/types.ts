import type { CheckInputDto } from "../types/checks";
import type { ClaimAnalysisDto } from "../types/claim";
import type { CheckResultDto, EvidenceItemDto, VerdictBand } from "../types/results";

export type ClaimAnalysisResult = Omit<ClaimAnalysisDto, "checkId" | "createdAt" | "updatedAt">;

export interface ClaimAnalysisInput {
  input: CheckInputDto;
  extractedTitle: string | null;
  extractedTextExcerpt: string | null;
}

export interface DiscoveryInput {
  originalInput: CheckInputDto;
  claimAnalysis: ClaimAnalysisResult;
}

export interface DiscoveredSource {
  url: string;
  title: string | null;
  snippet?: string | null | undefined;
}

export interface SourceForAssessment {
  resolvedUrl: string;
  domain: string;
  title: string | null;
  textExcerpt: string;
  extractionMethod: string | null;
  isSnippetOnly: boolean;
}

export interface SourceAssessment {
  sourceUrl: string;
  relation: "supports" | "contradicts" | "neutral";
  scopeMatch: number;
  credibilityLabel: string;
  isPrimary: boolean;
  rationale: string;
  evidenceText: string;
}

export interface ResultCopyInput {
  mainClaim: string;
  verdictBand: VerdictBand;
  evidence: readonly EvidenceItemDto[];
  uncertaintyLines: readonly string[];
}

export interface ResultCopy {
  headline: string;
  description: string;
  uncertaintyLines: string[];
  noteText: string;
  summaryText: string;
}

export interface EvidenceProviderMetadata {
  provider: string;
  discoveryProvider: string;
  model: string;
}

export interface EvidenceProvider {
  readonly metadata: EvidenceProviderMetadata;
  analyzeClaim(input: ClaimAnalysisInput): Promise<ClaimAnalysisResult>;
  discoverSources(input: DiscoveryInput, maxCandidates: number): Promise<DiscoveredSource[]>;
  assessSources(
    claim: string,
    sources: readonly SourceForAssessment[],
  ): Promise<SourceAssessment[]>;
  writeResultCopy(input: ResultCopyInput): Promise<ResultCopy>;
}

export class EvidenceProviderError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "EvidenceProviderError";
  }
}

export function applyResultCopy(result: CheckResultDto, copy: ResultCopy): CheckResultDto {
  return {
    ...result,
    headline: copy.headline,
    description: copy.description,
    uncertaintyLines: copy.uncertaintyLines,
    noteText: copy.noteText,
    summaryText: copy.summaryText,
  };
}
