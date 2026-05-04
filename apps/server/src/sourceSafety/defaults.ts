import { defaultResolveHostname } from "./urlSafety";
import type { SourceFetchOptions } from "./types";

const DEFAULT_TIMEOUT_MS = 8_000;
const DEFAULT_MAX_BYTES = 1_000_000;
const DEFAULT_MAX_REDIRECTS = 5;

export function defaultSourceFetchOptions(): SourceFetchOptions {
  return {
    fetch: (url, init) => fetch(url, init),
    resolveHostname: defaultResolveHostname(),
    timeoutMs: DEFAULT_TIMEOUT_MS,
    maxBytes: DEFAULT_MAX_BYTES,
    maxRedirects: DEFAULT_MAX_REDIRECTS,
  };
}
