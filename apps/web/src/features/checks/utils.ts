export function readCheckId(param: unknown) {
  return typeof param === "string" && param.length > 0 ? param : null;
}

export function isSafeHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
