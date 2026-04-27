import type { CheckApiErrorDto } from "../types/checks";

export function makeCheckError(input: {
  code: string;
  category: string;
  message: string;
  retryable?: boolean;
  traceId?: string | null;
  occurredAt?: string;
}): CheckApiErrorDto {
  return {
    code: input.code,
    category: input.category,
    message: input.message,
    retryable: input.retryable ?? true,
    traceId: input.traceId ?? null,
    occurredAt: input.occurredAt ?? new Date().toISOString(),
  };
}
