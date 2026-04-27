import type { CheckResultDto } from "./results";

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
