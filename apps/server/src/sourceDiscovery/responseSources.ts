import type { DiscoveredSource } from "./types";

export function dedupeSources(sources: readonly DiscoveredSource[]): DiscoveredSource[] {
  const seen = new Set<string>();
  const deduped: DiscoveredSource[] = [];

  for (const source of sources) {
    const normalized = normalizeSourceUrl(source.url);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    deduped.push({ url: normalized, title: source.title, snippet: source.snippet ?? null });
  }

  return deduped;
}

export function extractSourcesFromResponse(value: unknown): DiscoveredSource[] {
  const found: DiscoveredSource[] = [];
  collectSources(value, found, 0);
  return found;
}

function normalizeSourceUrl(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

function collectSources(value: unknown, found: DiscoveredSource[], depth: number): void {
  if (depth > 8 || value === null || value === undefined) return;

  if (Array.isArray(value)) {
    for (const item of value) collectSources(item, found, depth + 1);
    return;
  }

  if (typeof value !== "object") return;

  const record = value as Record<string, unknown>;
  const url = readString(record, "url") ?? readString(record, "uri");
  if (url) {
    found.push({
      url,
      title: readString(record, "title"),
      snippet: readString(record, "snippet") ?? readString(record, "text"),
    });
  }

  for (const child of Object.values(record)) {
    collectSources(child, found, depth + 1);
  }
}

function readString(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  return typeof value === "string" && value.trim() ? value : null;
}
