import type { FetchLike, SourceFetchOptions } from "../../sourceSafety/types";

export function fakeSourceFetchOptions(
  overrides: Partial<SourceFetchOptions> = {},
): SourceFetchOptions {
  return {
    fetch: fakeFetch,
    resolveHostname: async (hostname) =>
      hostname === "127.0.0.1" ? ["127.0.0.1"] : ["93.184.216.34"],
    timeoutMs: 200,
    maxBytes: 50_000,
    maxRedirects: 3,
    ...overrides,
  };
}

const fakeFetch: FetchLike = async (url) => {
  const hostname = new URL(url).hostname;
  return new Response(
    `<html><head><title>${hostname} source</title></head><body><main>This verified article says independent sources support this claim with enough context for the backend evidence pipeline to evaluate relation and scope. It includes relevant details, background, and direct wording for the submitted claim.</main></body></html>`,
    {
      status: 200,
      headers: { "content-type": "text/html; charset=utf-8" },
    },
  );
};
