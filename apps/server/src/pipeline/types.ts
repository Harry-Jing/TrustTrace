import type { Logger } from "pino";

import type { EvidenceProvider } from "../evidenceProvider/types";
import type { SourceFetchOptions } from "../sourceSafety/types";
import type { ClaimAnalysisDto } from "../types/claim";

export interface EvidencePipelineOptions {
  logger: Logger;
  evidenceProvider: EvidenceProvider;
  sourceFetchOptions?: SourceFetchOptions;
  maxCandidateSources: number;
  maxEvidenceSources: number;
  delayMs?: number;
}

export interface PreparedClaim {
  claimAnalysis: ClaimAnalysisDto;
}
