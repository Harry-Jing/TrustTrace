import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

import { SourceFetchError, type ResolveHostname } from "./types";

export function defaultResolveHostname(): ResolveHostname {
  return async (hostname) => {
    const records = await lookup(hostname, { all: true });
    return records.map((record) => record.address);
  };
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

export function canonicalHttpUrl(value: string): string {
  return parseHttpUrl(value).toString();
}

export function parseHttpUrl(value: string): URL {
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

export function isUnsafeIpAddress(address: string): boolean {
  const normalized = normalizeHostname(address);
  const version = isIP(normalized);

  if (version === 4) return isUnsafeIpv4(normalized);
  if (version === 6) return isUnsafeIpv6(normalized);
  return true;
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
  const mappedIpv4 = readIpv4MappedAddress(normalized);
  if (mappedIpv4) return isUnsafeIpv4(mappedIpv4);

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

function readIpv4MappedAddress(address: string): string | null {
  const dotted = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(address);
  if (dotted?.[1]) return dotted[1];

  const hex = /^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/.exec(address);
  const highPart = hex?.[1];
  const lowPart = hex?.[2];
  if (!highPart || !lowPart) return null;

  const high = Number.parseInt(highPart, 16);
  const low = Number.parseInt(lowPart, 16);
  if (high > 0xffff || low > 0xffff) return null;

  return `${String(high >> 8)}.${String(high & 0xff)}.${String(low >> 8)}.${String(low & 0xff)}`;
}
