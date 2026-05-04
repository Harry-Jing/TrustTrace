import { isApiErrorCode, type ApiErrorCodeDto } from "@trusttrace/contracts/checks";

import { HttpApiError } from "@/features/checks/api/backendChecksClient";

/**
 * Friendly user-facing copy keyed by transport-level (HTTP) error code, in
 * the same `Record<DtoCode, ...>` shape as `errorCopy.ts` for pipeline-level
 * codes. Adding a new code to `API_ERROR_CODES` in contracts surfaces a TS
 * error here until copy is added — single source of truth for which codes
 * have meaningful UI explanation.
 *
 * Pipeline-level errors (`CHECK_ERROR_CODES`) describe outcomes of a
 * persisted check; these describe failures of the HTTP request itself.
 * Keeping them in separate registries prevents the two namespaces from
 * leaking copy semantics into each other.
 */
export const API_ERROR_COPY: Record<ApiErrorCodeDto, string> = {
  INTERNAL_ERROR: "Something went wrong on the TrustTrace server. Please try again in a moment.",
  // The validation message from the backend is already specific (which field
  // failed and why), so we surface it verbatim rather than a generic line.
  INVALID_CHECK_INPUT: "",
  INVALID_LIST_QUERY:
    "TrustTrace couldn't read your history filters. Refreshing the page usually fixes this.",
  INVALID_EVENTS_QUERY:
    "TrustTrace couldn't subscribe to live updates for this check. Try reloading.",
  CHECK_NOT_FOUND:
    "We couldn't find that check. It may have been deleted, or the link is out of date.",
};

/**
 * Resolve a friendly explanation for a request error. Falls back to the
 * supplied generic in three cases:
 *  1. The error is not an `HttpApiError` (network failure, contract violation)
 *  2. The HTTP code is unknown to this build of the frontend
 *  3. The mapped copy is empty (i.e. the backend's own message is preferred —
 *     e.g. validation messages that already describe the offending field)
 */
export function describeRequestError(error: unknown, fallback: string): string {
  if (!(error instanceof HttpApiError)) {
    return error instanceof Error ? error.message : fallback;
  }

  if (error.code !== null && isApiErrorCode(error.code)) {
    const copy = API_ERROR_COPY[error.code];
    if (copy.length > 0) return copy;
    // Empty copy = "trust the backend's specific message" — used for
    // validation errors where the backend reports the offending field.
    if (error.message.length > 0) return error.message;
  }

  return error.message.length > 0 ? error.message : fallback;
}
