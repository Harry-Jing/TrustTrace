import type { VerdictBand } from "../types/results";

export interface VerdictBandInput {
  evidenceCount: number;
  directCount: number;
  fullTextDirectCount: number;
  fullTextDirectIndependent: number;
  avgDirectScope: number;
  avgFullTextDirectScope: number;
  supports: number;
  contradicts: number;
}

export function chooseVerdictBand(input: VerdictBandInput): VerdictBand {
  if (input.evidenceCount === 0) return "needs_context";
  if (input.directCount === 0) return "needs_context";
  if (input.supports > 0 && input.contradicts > 0) return "evidence_mixed";
  if (
    input.fullTextDirectCount >= 2 &&
    input.fullTextDirectIndependent >= 2 &&
    input.avgFullTextDirectScope >= 0.65
  ) {
    return "evidence_strong";
  }
  if (input.directCount >= 2 || input.avgDirectScope >= 0.5) return "evidence_weak";
  return "evidence_thin";
}
