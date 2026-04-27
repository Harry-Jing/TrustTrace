import { describe, expect, it } from "bun:test";

import {
  assertSafeUrl,
  fetchAndExtractSource,
  SourceFetchError,
  type FetchLike,
  type SourceFetchOptions,
} from "../sourceSafety";

const PUBLIC_RESOLVER = async () => ["93.184.216.34"];

describe("source URL safety", () => {
  it("rejects non-http protocols and localhost targets", async () => {
    await expect(assertSafeUrl("file:///etc/passwd", PUBLIC_RESOLVER)).rejects.toThrow(
      SourceFetchError,
    );
    await expect(assertSafeUrl("http://localhost/admin", PUBLIC_RESOLVER)).rejects.toThrow(
      SourceFetchError,
    );
  });

  it("rejects loopback, private IPv4, private IPv6, and DNS-to-private targets", async () => {
    await expect(assertSafeUrl("http://127.0.0.1/admin", PUBLIC_RESOLVER)).rejects.toThrow(
      SourceFetchError,
    );
    await expect(assertSafeUrl("http://192.168.1.10/admin", PUBLIC_RESOLVER)).rejects.toThrow(
      SourceFetchError,
    );
    await expect(assertSafeUrl("http://[::1]/admin", PUBLIC_RESOLVER)).rejects.toThrow(
      SourceFetchError,
    );
    await expect(
      assertSafeUrl("http://[::ffff:127.0.0.1]/admin", PUBLIC_RESOLVER),
    ).rejects.toMatchObject({ code: "UNSAFE_IP_ADDRESS" });
    await expect(
      assertSafeUrl("http://[::ffff:c0a8:101]/admin", PUBLIC_RESOLVER),
    ).rejects.toMatchObject({ code: "UNSAFE_IP_ADDRESS" });
    await expect(assertSafeUrl("https://example.test", async () => ["10.0.0.4"])).rejects.toThrow(
      SourceFetchError,
    );
  });

  it("rejects redirects to unsafe targets", async () => {
    const fetcher: FetchLike = async () =>
      new Response(null, {
        status: 302,
        headers: { location: "http://127.0.0.1/private" },
      });

    await expect(
      fetchAndExtractSource("https://example.test", options({ fetch: fetcher })),
    ).rejects.toMatchObject({
      code: "UNSAFE_IP_ADDRESS",
    });
  });

  it("enforces redirect count, timeout, size, and content type limits", async () => {
    const redirectFetch: FetchLike = async () =>
      new Response(null, { status: 302, headers: { location: "https://example.test/next" } });
    await expect(
      fetchAndExtractSource(
        "https://example.test",
        options({ fetch: redirectFetch, maxRedirects: 1 }),
      ),
    ).rejects.toMatchObject({ code: "REDIRECT_LIMIT_EXCEEDED" });

    const timeoutFetch: FetchLike = (_url, init) =>
      new Promise((_resolve, reject) => {
        init.signal?.addEventListener("abort", () => reject(new Error("aborted")), { once: true });
      });
    await expect(
      fetchAndExtractSource("https://example.test", options({ fetch: timeoutFetch, timeoutMs: 1 })),
    ).rejects.toMatchObject({ code: "FETCH_TIMEOUT" });

    const largeFetch: FetchLike = async () =>
      new Response("x".repeat(120), { status: 200, headers: { "content-type": "text/plain" } });
    await expect(
      fetchAndExtractSource("https://example.test", options({ fetch: largeFetch, maxBytes: 20 })),
    ).rejects.toMatchObject({ code: "CONTENT_TOO_LARGE" });

    const pdfFetch: FetchLike = async () =>
      new Response("%PDF", { status: 200, headers: { "content-type": "application/pdf" } });
    await expect(
      fetchAndExtractSource("https://example.test", options({ fetch: pdfFetch })),
    ).rejects.toMatchObject({
      code: "CONTENT_TYPE_UNSUPPORTED",
    });
  });

  it("extracts text and metadata from safe HTML sources", async () => {
    const result = await fetchAndExtractSource(
      "https://example.test/article#section",
      options({
        fetch: async () =>
          new Response(
            "<html><head><title>Example &amp; Source</title><script>bad()</script></head><body><main>This public article contains enough meaningful text to satisfy extraction and provide source material for TrustTrace evidence assessment. It avoids scripts and leaves readable text behind.</main></body></html>",
            { status: 200, headers: { "content-type": "text/html; charset=utf-8" } },
          ),
      }),
    );

    expect(result.resolvedUrl).toBe("https://example.test/article");
    expect(result.domain).toBe("example.test");
    expect(result.title).toBe("Example & Source");
    expect(result.extractedText).toContain("public article contains enough meaningful text");
    expect(result.extractedText).not.toContain("bad()");
    expect(result.contentHash).toHaveLength(64);
  });
});

function options(overrides: Partial<SourceFetchOptions>): SourceFetchOptions {
  return {
    fetch: async () =>
      new Response(
        "This public source contains enough meaningful plain text for extraction and evidence assessment by the backend pipeline.",
        { status: 200, headers: { "content-type": "text/plain" } },
      ),
    resolveHostname: PUBLIC_RESOLVER,
    timeoutMs: 200,
    maxBytes: 1_000,
    maxRedirects: 3,
    ...overrides,
  };
}
