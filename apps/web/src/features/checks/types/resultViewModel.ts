import type { CredibilityCue } from "@/features/checks/types/cues";
import type { EvidenceItem } from "@/features/checks/types/evidence";

export type VerdictBand =
  | "evidence_strong"
  | "evidence_mixed"
  | "evidence_weak"
  | "evidence_thin"
  | "needs_context"
  | "system_failed";

export type UncertaintyLevel = "low" | "med" | "high";

export interface ResultAtAGlance {
  evidence: number;
  independent: number;
  fullText: number;
  primary: number;
  snippet: number;
  uncertainty: UncertaintyLevel;
}

export interface CheckResultViewModel {
  checkId: string;
  inputText: string;
  inputTypeLabel: string;
  durationLabel: string;
  verdictBand: VerdictBand;
  verdictLabel: string;
  headline: string;
  description: string;
  atAGlance: ResultAtAGlance;
  cues: readonly CredibilityCue[];
  evidence: readonly EvidenceItem[];
  uncertaintyLines: readonly string[];
  noteText: string;
  summaryText: string;
}
