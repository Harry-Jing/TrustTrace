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
