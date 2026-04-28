import type { Logger } from "pino";

import type { EvidenceProvider } from "../evidenceProvider/types";
import type { SourceDiscoveryProvider } from "../sourceDiscovery/types";
import type { SourceFetchOptions } from "../sourceSafety/types";
import type { DiscoveryStrategy } from "../types/checks";
import type { ClaimAnalysisDto } from "../types/claim";

export interface EvidencePipelineOptions {
  logger: Logger;
  evidenceProvider: EvidenceProvider;
  discoveryProviders: Record<DiscoveryStrategy, SourceDiscoveryProvider>;
  sourceFetchOptions?: SourceFetchOptions;
  maxCandidateSources: number;
  maxEvidenceSources: number;
  delayMs?: number;
}

export interface PreparedClaim {
  claimAnalysis: ClaimAnalysisDto;
}
