import { createHash } from "node:crypto";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export type FetchLike = (url: string, init: RequestInit) => Promise<Response>;
export type ResolveHostname = (hostname: string) => Promise<readonly string[]>;

export interface SourceFetchOptions {
  fetch: FetchLike;
  resolveHostname: ResolveHostname;
  timeoutMs: number;
  maxBytes: number;
  maxRedirects: number;
}

export interface SourceFetchSuccess {
  resolvedUrl: string;
  domain: string;
  title: string | null;
  httpStatus: number;
  contentType: string;
  contentHash: string;
  extractionMethod: string;
  extractedText: string;
  textExcerpt: string;
}

export class SourceFetchError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "SourceFetchError";
  }
}

const DEFAULT_TIMEOUT_MS = 8_000;
const DEFAULT_MAX_BYTES = 1_000_000;
const DEFAULT_MAX_REDIRECTS = 5;
const TEXT_DECODER = new TextDecoder();

export function defaultSourceFetchOptions(): SourceFetchOptions {
  return {
    fetch: (url, init) => fetch(url, init),
    resolveHostname: async (hostname) => {
      const records = await lookup(hostname, { all: true });
      return records.map((record) => record.address);
    },
    timeoutMs: DEFAULT_TIMEOUT_MS,
    maxBytes: DEFAULT_MAX_BYTES,
    maxRedirects: DEFAULT_MAX_REDIRECTS,
  };
}

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

export async function assertSafeUrl(
  urlValue: string,
  resolveHostname: ResolveHostname,
): Promise<void> {
  const url = parseHttpUrl(urlValue);
  const hostname = normalizeHostname(url.hostname);

  if (isLocalHostname(hostname)) {
    throw new SourceFetchError("UNSAFE_LOCAL_HOSTNAME", "Local hostnames are not allowed.");
  }

  if (isIpAddress(hostname)) {
    if (isUnsafeIpAddress(hostname)) {
      throw new SourceFetchError(
        "UNSAFE_IP_ADDRESS",
        "Local or private IP addresses are not allowed.",
      );
    }
    return;
  }

  const addresses = await resolveHostname(hostname);
  if (addresses.length === 0) {
    throw new SourceFetchError("DNS_NO_RECORDS", "Host did not resolve to an IP address.");
  }

  for (const address of addresses) {
    if (isUnsafeIpAddress(address)) {
      throw new SourceFetchError(
        "DNS_RESOLVED_TO_UNSAFE_IP",
        "Host resolved to a local or private IP address.",
      );
    }
  }
}

function parseHttpUrl(value: string): URL {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new SourceFetchError("INVALID_URL", "Source URL is invalid.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new SourceFetchError("UNSUPPORTED_PROTOCOL", "Only http(s) URLs are allowed.");
  }

  if (!url.hostname) {
    throw new SourceFetchError("MISSING_HOSTNAME", "Source URL is missing a hostname.");
  }

  url.hash = "";
  return url;
}

function normalizeHostname(hostname: string): string {
  return hostname.toLowerCase().replace(/^\[(.*)]$/, "$1");
}

function isLocalHostname(hostname: string): boolean {
  return hostname === "localhost" || hostname.endsWith(".localhost");
}

function isIpAddress(hostname: string): boolean {
  return isIP(hostname) !== 0;
}

export function isUnsafeIpAddress(address: string): boolean {
  const normalized = normalizeHostname(address);
  const version = isIP(normalized);

  if (version === 4) return isUnsafeIpv4(normalized);
  if (version === 6) return isUnsafeIpv6(normalized);
  return true;
}

function isUnsafeIpv4(address: string): boolean {
  const octets = address.split(".").map((part) => Number(part));
  if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet))) return true;

  const [a, b] = octets;
  if (a === undefined || b === undefined) return true;

  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19))
  );
}

function isUnsafeIpv6(address: string): boolean {
  const normalized = address.toLowerCase();
  const mappedIpv4 = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mappedIpv4?.[1]) return isUnsafeIpv4(mappedIpv4[1]);

  return (
    normalized === "::" ||
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe8") ||
    normalized.startsWith("fe9") ||
    normalized.startsWith("fea") ||
    normalized.startsWith("feb")
  );
}

async function fetchWithTimeout(url: string, options: SourceFetchOptions): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs);

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

async function readLimitedBody(response: Response, maxBytes: number): Promise<string> {
  if (!response.body) {
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > maxBytes) {
      throw new SourceFetchError("CONTENT_TOO_LARGE", "Source response body exceeds the limit.");
    }
    return TEXT_DECODER.decode(buffer);
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;

      total += value.byteLength;
      if (total > maxBytes) {
        throw new SourceFetchError("CONTENT_TOO_LARGE", "Source response body exceeds the limit.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return TEXT_DECODER.decode(body);
}

function extractText(
  body: string,
  contentType: string,
  url: string,
): { method: string; title: string | null; text: string } {
  if (contentType.toLowerCase().includes("text/plain")) {
    return {
      method: "plain_text",
      title: null,
      text: normalizeWhitespace(body),
    };
  }

  const title = extractTitle(body) ?? new URL(url).hostname;
  const withoutScripts = body
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");
  const text = normalizeWhitespace(withoutScripts.replace(/<[^>]+>/g, " "));

  return {
    method: "html_basic",
    title,
    text: decodeHtmlEntities(text),
  };
}

function extractTitle(html: string): string | null {
  const match = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  if (!match?.[1]) return null;
  return decodeHtmlEntities(normalizeWhitespace(match[1]));
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function truncate(value: string, maxLength: number): string {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 1)}…`;
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
