import { isCheckErrorCode } from "@trusttrace/contracts/checks";

import { EvidenceProviderError } from "./types";

export function providerError(
  error: unknown,
  fallbackCode: string,
  fallbackMessage: string,
): EvidenceProviderError {
  if (error instanceof EvidenceProviderError && isCheckErrorCode(error.code)) return error;

  const message = error instanceof Error ? error.message : fallbackMessage;
  const name = error instanceof Error ? error.name : "";
  const code = /timeout|timed out/i.test(`${name} ${message}`) ? "PROVIDER_TIMEOUT" : fallbackCode;

  return new EvidenceProviderError(code, message);
}
