import type { EvidenceProvider } from "../evidenceProvider/types";
import type { ChecksRepository } from "../repositories/repositoryFacade";
import { errorMessage, providerAuditErrorCode } from "./errors";

export async function callProvider<T>(
  repository: ChecksRepository,
  evidenceProvider: EvidenceProvider,
  checkId: string,
  operation: string,
  requestJson: unknown,
  execute: () => Promise<T>,
): Promise<T> {
  const providerCall = repository.createProviderCall({
    checkId,
    operation,
    provider:
      operation === "source_discovery"
        ? evidenceProvider.metadata.discoveryProvider
        : evidenceProvider.metadata.provider,
    model: evidenceProvider.metadata.model,
    requestJson: compactJson(requestJson),
    createdAt: new Date().toISOString(),
  });

  try {
    const response = await execute();
    repository.updateProviderCall(providerCall.id, {
      status: "succeeded",
      responseJson: compactJson(response),
      errorCode: null,
      errorMessage: null,
      completedAt: new Date().toISOString(),
    });
    return response;
  } catch (error) {
    repository.updateProviderCall(providerCall.id, {
      status: "failed",
      errorCode: providerAuditErrorCode(error),
      errorMessage: errorMessage(error, "Provider call failed."),
      completedAt: new Date().toISOString(),
    });
    throw error;
  }
}

function compactJson(value: unknown, depth = 0): unknown {
  if (depth > 5) return "[truncated]";
  if (typeof value === "string") return value.length <= 4_000 ? value : `${value.slice(0, 4_000)}…`;
  if (typeof value !== "object" || value === null) return value;
  if (Array.isArray(value)) return value.slice(0, 25).map((item) => compactJson(item, depth + 1));

  const compacted: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value)) {
    compacted[key] = compactJson(child, depth + 1);
  }
  return compacted;
}
