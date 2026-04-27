import type { CheckProgress, CheckStatus } from "@/features/checks/types/progress";
import type { CheckResultViewModel } from "@/features/checks/types/resultViewModel";
import type { CheckInputDraft } from "@/features/checks/types/input";

export interface CheckListParams {
  limit?: number;
  offset?: number;
}

export interface CheckApiError {
  code: string;
  category: string;
  message: string;
  retryable: boolean;
  traceId: string | null;
  occurredAt: string;
}

export interface CreateCheckResponse {
  checkId: string;
  status: CheckStatus;
  progress: CheckProgress;
  eventsUrl: string;
  createdAt: string;
}

export interface CheckRecord {
  checkId: string;
  status: CheckStatus;
  input: CheckInputDraft | null;
  progress: CheckProgress;
  result: CheckResultViewModel | null;
  error: CheckApiError | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}
