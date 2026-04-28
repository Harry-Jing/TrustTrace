import type { CheckInputDto } from "../types/checks";
import type { ClaimAnalysisDto } from "../types/claim";

export type DiscoveryClaim = Omit<ClaimAnalysisDto, "checkId" | "createdAt" | "updatedAt">;

export interface DiscoveryInput {
  originalInput: CheckInputDto;
  claimAnalysis: DiscoveryClaim;
}

export interface DiscoveredSource {
  url: string;
  title: string | null;
  snippet?: string | null | undefined;
}

export interface DiscoveryProviderMetadata {
  provider: string;
  model: string;
}

export interface SourceDiscoveryProvider {
  readonly metadata: DiscoveryProviderMetadata;
  discoverSources(input: DiscoveryInput, maxCandidates: number): Promise<DiscoveredSource[]>;
}
