/**
 * Source ranking — shared scoring helpers used by discovery and
 * evidence selection.
 *
 * The pipeline applies the same authority-aware score at three points:
 * raw discovery results (`rankDiscoveredSources`), candidate DB records
 * pre-fetch (`rankCandidateRecords`), and verified evidence sources
 * post-extraction (`rankEvidenceSources`). `selectBestEvidenceByDomain`
 * then enforces single-source-per-domain so one publisher cannot
 * dominate the verdict.
 *
 * Authority weights and snippet penalties below are policy choices —
 * adjust them with the consequences for the verdict band in mind.
 */

import type { SourceExtractionRecordDto } from "../types/sources";

export interface DiscoveredSourceLike {
  url: string;
  title: string | null;
  snippet?: string | null | undefined;
}

interface CandidateLike {
  candidateUrl: string;
  title: string | null;
  discoveryRank: number;
  discoverySnippet: string | null;
}

export function dedupeDiscoveredSources<T extends DiscoveredSourceLike>(
  sources: readonly T[],
): T[] {
  const seen = new Set<string>();
  const deduped: T[] = [];

  for (const source of sources) {
    const canonicalUrl = canonicalRankingUrl(source.url);
    if (!canonicalUrl || seen.has(canonicalUrl)) continue;
    seen.add(canonicalUrl);
    deduped.push(source);
  }

  return deduped;
}

export function rankDiscoveredSources<T extends DiscoveredSourceLike>(sources: readonly T[]): T[] {
  return [...sources].sort((left, right) => {
    const scoreDelta = discoveredScore(right) - discoveredScore(left);
    if (scoreDelta !== 0) return scoreDelta;
    return left.url.localeCompare(right.url);
  });
}

export function rankCandidateRecords<T extends CandidateLike>(sources: readonly T[]): T[] {
  return [...sources].sort((left, right) => {
    const scoreDelta = candidateScore(right) - candidateScore(left);
    if (scoreDelta !== 0) return scoreDelta;
    return left.discoveryRank - right.discoveryRank;
  });
}

export function rankEvidenceSources<T extends SourceExtractionRecordDto>(
  sources: readonly T[],
): T[] {
  return [...sources].sort((left, right) => {
    const scoreDelta = evidenceSourceScore(right) - evidenceSourceScore(left);
    if (scoreDelta !== 0) return scoreDelta;
    return left.discoveryRank - right.discoveryRank;
  });
}

export function selectBestEvidenceByDomain<T extends SourceExtractionRecordDto>(
  sources: readonly T[],
  maxSources: number,
): T[] {
  const selected: T[] = [];
  const seenDomains = new Set<string>();

  for (const source of rankEvidenceSources(sources)) {
    const domain = source.domain ?? domainFromUrl(source.resolvedUrl ?? source.candidateUrl);
    if (!domain || seenDomains.has(domain)) continue;
    seenDomains.add(domain);
    selected.push(source);
    if (selected.length >= maxSources) break;
  }

  return selected;
}

export function authorityScoreForUrl(urlValue: string, title: string | null = null): number {
  const url = parseUrl(urlValue);
  if (!url) return 0;

  const hostname = url.hostname.toLowerCase();
  const titleText = title?.toLowerCase() ?? "";
  let score = 0;

  // Authority TLD weights are an institutional-trust ordering: .gov/.mil
  // (top, primary government), .edu (academic), .int (intergovernmental
  // body). The 5/4/3 gaps leave room for the curated official/academic
  // host bonuses below to break ties without one signal dominating.
  if (hostname.endsWith(".gov") || hostname.endsWith(".mil")) score += 5;
  if (hostname.endsWith(".edu")) score += 4;
  if (hostname.endsWith(".int")) score += 3;

  if (isKnownOfficialHost(hostname)) score += 4;
  if (isKnownAcademicHost(hostname)) score += 3;
  if (isLikelyPrimaryPath(url.pathname) || isLikelyPrimaryTitle(titleText)) score += 1;

  return score;
}

export function isSnippetOnlySource(source: SourceExtractionRecordDto): boolean {
  return source.verificationStatus === "snippet_only" || source.extractionMethod === "snippet_only";
}

function discoveredScore(source: DiscoveredSourceLike): number {
  return authorityScoreForUrl(source.url, source.title) * 10 + (source.snippet ? 1 : 0);
}

function candidateScore(source: CandidateLike): number {
  return (
    authorityScoreForUrl(source.candidateUrl, source.title) * 10 +
    (source.discoverySnippet ? 1 : 0) -
    source.discoveryRank / 100
  );
}

function evidenceSourceScore(source: SourceExtractionRecordDto): number {
  const resolvedUrl = source.resolvedUrl ?? source.candidateUrl;
  // Snippet-only sources get a deliberately heavy penalty so they
  // cannot outrank a single full-text source even when their domain
  // has higher authority. The asymmetry (-25 vs +12) is what enforces
  // "snippet_only is weak context" without a hard exclude.
  const fullTextBonus = isSnippetOnlySource(source) ? -25 : 12;
  // Cap excerpt-length contribution at 5 so one very long article
  // cannot outrank multiple shorter primary sources purely on size.
  const textLengthBonus = Math.min((source.textExcerpt?.length ?? 0) / 200, 5);

  return (
    authorityScoreForUrl(resolvedUrl, source.title) * 10 +
    fullTextBonus +
    textLengthBonus -
    source.discoveryRank / 100
  );
}

function canonicalRankingUrl(value: string): string | null {
  const url = parseUrl(value);
  if (!url) return null;
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  url.hash = "";
  return url.toString();
}

function domainFromUrl(value: string): string | null {
  return parseUrl(value)?.hostname.toLowerCase() ?? null;
}

function parseUrl(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function isKnownOfficialHost(hostname: string): boolean {
  return [
    "who.int",
    "cdc.gov",
    "nih.gov",
    "fda.gov",
    "epa.gov",
    "nasa.gov",
    "noaa.gov",
    "census.gov",
    "bls.gov",
    "sec.gov",
    "ftc.gov",
    "federalreserve.gov",
    "supreme.justia.com",
    "congress.gov",
  ].some((officialHost) => hostname === officialHost || hostname.endsWith(`.${officialHost}`));
}

function isKnownAcademicHost(hostname: string): boolean {
  return [
    "pubmed.ncbi.nlm.nih.gov",
    "ncbi.nlm.nih.gov",
    "nature.com",
    "science.org",
    "thelancet.com",
    "nejm.org",
    "jamanetwork.com",
    "arxiv.org",
  ].some((academicHost) => hostname === academicHost || hostname.endsWith(`.${academicHost}`));
}

function isLikelyPrimaryPath(pathname: string): boolean {
  const normalized = pathname.toLowerCase();
  return /\b(report|research|study|dataset|data|statistics|guidance|regulation|rule|filing)\b/.test(
    normalized,
  );
}

function isLikelyPrimaryTitle(title: string): boolean {
  return /\b(report|study|dataset|statistics|guidance|regulation|filing|official)\b/.test(title);
}
