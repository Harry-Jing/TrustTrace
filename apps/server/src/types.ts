export type CheckStatus = "queued" | "running" | "completed" | "failed";

export type CheckPhase =
  | "understanding"
  | "strategy"
  | "discovery"
  | "verify_read"
  | "weigh"
  | "verdict"
  | "completed"
  | "failed";

export type InputType = "text" | "url";

export interface CheckInputDto {
  type: InputType;
  content: string;
}

export interface CheckApiErrorDto {
  code: string;
  category: string;
  message: string;
  retryable: boolean;
  traceId: string | null;
  occurredAt: string;
}

export interface CheckProgressDto {
  checkId: string;
  status: CheckStatus;
  phase: CheckPhase;
  percent: number;
  message: string;
  eventSeq: number;
  updatedAt: string;
}

export interface ProgressEventDto {
  seq: number;
  checkId: string;
  status: CheckStatus;
  phase: CheckPhase;
  percent: number;
  message: string;
  provider: string | null;
  stepCode: string | null;
  error: CheckApiErrorDto | null;
  createdAt: string;
}

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

export interface CheckRecordDto {
  checkId: string;
  status: CheckStatus;
  input: CheckInputDto | null;
  progress: CheckProgressDto;
  result: CheckResultDto | null;
  error: CheckApiErrorDto | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface CreateCheckResponseDto {
  checkId: string;
  status: CheckStatus;
  progress: CheckProgressDto;
  eventsUrl: string;
  createdAt: string;
}

export interface CheckListItemDto {
  checkId: string;
  claim: string;
  snippet: string;
  createdAt: string;
  cue: string;
  tone: "default" | "accent" | "warn" | "good" | "dark";
}

export type SourceExtractionStatus = "candidate" | "blocked" | "fetched" | "extraction_failed";

export interface SourceExtractionRecordDto {
  id: string;
  checkId: string;
  candidateUrl: string;
  resolvedUrl: string | null;
  domain: string | null;
  title: string | null;
  discoveryProvider: string;
  discoveryRank: number;
  verificationStatus: SourceExtractionStatus;
  httpStatus: number | null;
  contentType: string | null;
  contentHash: string | null;
  extractionMethod: string | null;
  extractedText: string | null;
  textExcerpt: string | null;
  failureCode: string | null;
  failureMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NewSourceExtractionDto {
  checkId: string;
  candidateUrl: string;
  title: string | null;
  discoveryProvider: string;
  discoveryRank: number;
  createdAt: string;
}

export interface SourceExtractionUpdateDto {
  resolvedUrl?: string | null;
  domain?: string | null;
  title?: string | null;
  verificationStatus?: SourceExtractionStatus;
  httpStatus?: number | null;
  contentType?: string | null;
  contentHash?: string | null;
  extractionMethod?: string | null;
  extractedText?: string | null;
  textExcerpt?: string | null;
  failureCode?: string | null;
  failureMessage?: string | null;
  updatedAt: string;
}
