export function extractText(
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

export function truncate(value: string, maxLength: number): string {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 1)}…`;
}

function extractTitle(html: string): string | null {
  const match = /<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(html);
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
