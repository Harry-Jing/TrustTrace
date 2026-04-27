export type VerdictBand =
  | "evidence_strong"
  | "evidence_mixed"
  | "evidence_weak"
  | "evidence_thin"
  | "needs_context"
  | "system_failed";

export interface ResultAtAGlanceDto {
  evidence: number;
  independent: number;
  fullText: number;
  primary: number;
  snippet: number;
  uncertainty: "low" | "med" | "high";
}

export interface CredibilityCueDto {
  name: string;
  text: string;
  note: string;
  strength: number;
  tooltip: string;
}

export interface EvidenceItemDto {
  sourceName: string;
  domain: string;
  credibilityLabel: string;
  date: string;
  title: string;
  text: string;
  url: string;
  relation: "supports" | "contradicts" | "neutral";
  tier: 1 | 2 | 3 | 4;
  scopeMatch: number;
  clusterId?: string;
}

export interface CheckResultDto {
  checkId: string;
  inputText: string;
  inputTypeLabel: string;
  durationLabel: string;
  verdictBand: VerdictBand;
  verdictLabel: string;
  headline: string;
  description: string;
  atAGlance: ResultAtAGlanceDto;
  cues: CredibilityCueDto[];
  evidence: EvidenceItemDto[];
  uncertaintyLines: string[];
  noteText: string;
  summaryText: string;
}
