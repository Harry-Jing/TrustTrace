import { SourceFetchError } from "./types";

const TEXT_DECODER = new TextDecoder();

export async function readLimitedBody(response: Response, maxBytes: number): Promise<string> {
  if (!response.body) {
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > maxBytes) {
      throw new SourceFetchError("CONTENT_TOO_LARGE", "Source response body exceeds the limit.");
    }
    return TEXT_DECODER.decode(buffer);
  }

  // Bun's ReadableStream type loses the Uint8Array chunk parameter in
  // the ESNext-only lib (DOM is excluded for backend); cast the read
  // result to recover the chunk type so value/byteLength are not `any`.
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    for (;;) {
      const { done, value } = (await reader.read()) as
        | { done: false; value: Uint8Array }
        | { done: true; value: undefined };
      if (done) break;

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
