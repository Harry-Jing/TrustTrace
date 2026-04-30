import { createHash } from "node:crypto";

import { readLimitedBody } from "./body";
import { extractText, truncate } from "./textExtraction";
import { SourceFetchError, type SourceFetchOptions, type SourceFetchSuccess } from "./types";
import { assertSafeUrl, parseHttpUrl } from "./urlSafety";

export async function fetchAndExtractSource(
  candidateUrl: string,
  options: SourceFetchOptions,
): Promise<SourceFetchSuccess> {
  let currentUrl = parseHttpUrl(candidateUrl).toString();

  for (let redirectCount = 0; redirectCount <= options.maxRedirects; redirectCount += 1) {
    await assertSafeUrl(currentUrl, options.resolveHostname);

    const response = await fetchWithTimeout(currentUrl, options);

    if (isRedirectStatus(response.status)) {
      if (redirectCount >= options.maxRedirects) {
        throw new SourceFetchError(
          "REDIRECT_LIMIT_EXCEEDED",
          "Source exceeded the redirect limit.",
        );
      }

      const location = response.headers.get("location");
      if (!location) {
        throw new SourceFetchError(
          "REDIRECT_WITHOUT_LOCATION",
          "Redirect response omitted Location.",
        );
      }
      currentUrl = parseHttpUrl(new URL(location, currentUrl).toString()).toString();
      continue;
    }

    if (!response.ok) {
      throw new SourceFetchError(
        "HTTP_STATUS_UNSUPPORTED",
        `Source returned HTTP status ${String(response.status)}.`,
      );
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!isSupportedContentType(contentType)) {
      throw new SourceFetchError(
        "CONTENT_TYPE_UNSUPPORTED",
        `Unsupported source content type: ${contentType || "unknown"}.`,
      );
    }

    const contentLength = readContentLength(response.headers.get("content-length"));
    if (contentLength !== null && contentLength > options.maxBytes) {
      throw new SourceFetchError("CONTENT_TOO_LARGE", "Source content length exceeds the limit.");
    }

    const body = await readLimitedBody(response, options.maxBytes);
    const extracted = extractText(body, contentType, currentUrl);
    if (extracted.text.length < 80) {
      throw new SourceFetchError("EXTRACTION_TOO_SHORT", "Source text was too short to evaluate.");
    }

    return {
      resolvedUrl: currentUrl,
      domain: new URL(currentUrl).hostname,
      title: extracted.title,
      httpStatus: response.status,
      contentType,
      contentHash: createHash("sha256").update(body).digest("hex"),
      extractionMethod: extracted.method,
      extractedText: extracted.text,
      textExcerpt: truncate(extracted.text, 1_200),
    };
  }

  throw new SourceFetchError("REDIRECT_LIMIT_EXCEEDED", "Source exceeded the redirect limit.");
}

async function fetchWithTimeout(url: string, options: SourceFetchOptions): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, options.timeoutMs);

  try {
    return await options.fetch(url, {
      redirect: "manual",
      signal: controller.signal,
      headers: {
        Accept: "text/html,application/xhtml+xml,text/plain;q=0.8,*/*;q=0.1",
        "User-Agent": "TrustTraceBot/0.1 (+https://trusttrace.local)",
      },
    });
  } catch (error) {
    if (controller.signal.aborted) {
      throw new SourceFetchError("FETCH_TIMEOUT", "Source fetch timed out.");
    }
    throw new SourceFetchError("FETCH_FAILED", errorMessage(error, "Source fetch failed."));
  } finally {
    clearTimeout(timeout);
  }
}

function isRedirectStatus(status: number): boolean {
  return status >= 300 && status <= 399;
}

function isSupportedContentType(contentType: string): boolean {
  const normalized = contentType.toLowerCase();
  return (
    normalized.includes("text/html") ||
    normalized.includes("application/xhtml+xml") ||
    normalized.includes("text/plain")
  );
}

function readContentLength(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
