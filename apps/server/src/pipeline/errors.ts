import { EvidenceProviderError } from "../evidenceProvider/types";
import { ChecksRepository } from "../repositories/repositoryFacade";
import { SourceFetchError } from "../sourceSafety/types";
import { makeCheckError } from "../synthesis/errors";
import type { CheckApiErrorDto } from "../types/checks";

export class PipelineCheckError extends Error {
  constructor(
    readonly code: string,
    readonly category: string,
    message: string,
    readonly retryable = true,
  ) {
    super(message);
    this.name = "PipelineCheckError";
  }
}

export function nextFailureSeq(checkId: string, repository: ChecksRepository): number {
  const record = repository.getCheck(checkId);
  if (!record) return 7;
  return Math.min(7, record.progress.eventSeq + 1);
}

export function normalizeSourceError(error: unknown): {
  code: string;
  message: string;
  blocked: boolean;
} {
  if (error instanceof SourceFetchError) {
    return {
      code: error.code,
      message: error.message,
      blocked:
        error.code.includes("UNSAFE") ||
        error.code.includes("PROTOCOL") ||
        error.code === "INVALID_URL" ||
        error.code.startsWith("DNS_"),
    };
  }

  return {
    code: "SOURCE_FETCH_FAILED",
    message: error instanceof Error ? error.message : "Source fetch failed.",
    blocked: false,
  };
}

export function errorToCheckError(error: unknown): CheckApiErrorDto {
  if (error instanceof PipelineCheckError) {
    return makeCheckError({
      code: error.code,
      category: error.category,
      message: error.message,
      retryable: error.retryable,
    });
  }

  if (error instanceof EvidenceProviderError) {
    return makeCheckError({
      code: error.code,
      category:
        error.code === "PROVIDER_CONFIGURATION_ERROR" ? "provider configuration" : "provider",
      message: error.message,
      retryable: error.code !== "PROVIDER_CONFIGURATION_ERROR",
    });
  }

  return makeCheckError({
    code: "PIPELINE_ERROR",
    category: "pipeline",
    message: error instanceof Error ? error.message : "The evidence pipeline failed.",
  });
}

export function providerAuditErrorCode(error: unknown): string {
  if (error instanceof EvidenceProviderError) return error.code;
  if (error instanceof PipelineCheckError) return error.code;
  if (error instanceof SourceFetchError) return error.code;
  return "PROVIDER_ERROR";
}

export function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
