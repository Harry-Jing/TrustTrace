import { isCheckErrorCode, type CheckErrorCodeDto } from "@trusttrace/contracts/checks";

export interface ErrorCodeMeta {
  /**
   * Plain-English explanation shown to end users. Keep this in the web app,
   * not in `packages/contracts`, because it is product copy rather than a
   * wire-format contract.
   */
  explanation: string;
  /**
   * Optional override for retryability hints in the UI. Falls back to the
   * per-error `retryable` flag when omitted.
   */
  retryable?: boolean;
  /**
   * Optional top-level action guidance. Used when generic retry/edit-claim
   * guidance would be misleading for a specific error code.
   */
  retryHelp?: string;
}

export const ERROR_CODE_META: Record<CheckErrorCodeDto, ErrorCodeMeta> = {
  INPUT_EXTRACTION_FAILED: {
    explanation:
      "TrustTrace couldn't fetch or read the submitted URL. The page may be blocked, behind a paywall, or temporarily unreachable. You can retry, or paste the article text directly instead.",
  },
  SOURCE_DISCOVERY_FAILED: {
    explanation:
      "The source-discovery provider didn't return any candidate URLs for this claim. This can happen for very narrow or non-public topics. Rephrasing the claim, or switching discovery strategy in Settings, may help.",
  },
  SOURCE_EXTRACTION_FAILED: {
    explanation:
      "Candidate URLs were found, but none could be safely fetched and read. Common causes are paywalls, JavaScript-only pages, or aggressive bot protection. Retrying often works on the next pass.",
  },
  CLAIM_ANALYSIS_FAILED: {
    explanation:
      "The model couldn't parse this claim into checkable sub-claims. This is usually a transient provider issue — retrying with the same claim usually works.",
  },
  PROVIDER_TIMEOUT: {
    explanation:
      "The AI provider didn't respond in time. This often happens during high traffic. Your claim was received but evaluation couldn't complete.",
  },
  PROVIDER_ERROR: {
    explanation:
      "The AI provider returned an unexpected error. This is typically a temporary issue on their end.",
  },
  PROVIDER_CONFIGURATION_ERROR: {
    explanation:
      "The server is missing or has invalid credentials for the AI provider. This is a TrustTrace-side configuration issue — retrying won't help until the operator fixes it.",
    retryable: false,
    retryHelp:
      "This is a TrustTrace server configuration issue. Please contact the operator or try again after the provider credentials are fixed.",
  },
  PIPELINE_ERROR: {
    explanation:
      "An unexpected internal error occurred while processing your check. If this keeps happening, the service may be experiencing issues.",
  },
};

export function getErrorCodeMeta(code: string): ErrorCodeMeta | null {
  return isCheckErrorCode(code) ? ERROR_CODE_META[code] : null;
}
