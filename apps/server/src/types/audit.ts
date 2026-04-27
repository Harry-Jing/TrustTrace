export type ProviderCallStatus = "started" | "succeeded" | "failed";

export interface ProviderCallRecordDto {
  id: string;
  checkId: string;
  operation: string;
  provider: string;
  model: string;
  status: ProviderCallStatus;
  requestJson: unknown;
  responseJson: unknown;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface NewProviderCallDto {
  checkId: string;
  operation: string;
  provider: string;
  model: string;
  requestJson: unknown;
  createdAt: string;
}

export interface ProviderCallUpdateDto {
  status: ProviderCallStatus;
  responseJson?: unknown;
  errorCode?: string | null;
  errorMessage?: string | null;
  completedAt: string;
}

export interface SourceEvaluationRecordDto {
  id: string;
  checkId: string;
  sourceExtractionId: string;
  sourceUrl: string;
  provider: string;
  model: string;
  relation: "supports" | "contradicts" | "neutral";
  scopeMatch: number;
  credibilityLabel: string;
  isPrimary: boolean;
  rationale: string;
  evidenceText: string;
  createdAt: string;
}
