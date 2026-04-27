import { fileURLToPath } from "node:url";

export interface ServerConfig {
  port: number;
  dbPath: string;
  logLevel: string;
}

const DEFAULT_DB_PATH = fileURLToPath(new URL("../data/trusttrace.sqlite", import.meta.url));

export function readConfig(env: Record<string, string | undefined> = Bun.env): ServerConfig {
  return {
    port: readPort(env.TRUSTTRACE_PORT),
    dbPath: env.TRUSTTRACE_DB_PATH?.trim() || DEFAULT_DB_PATH,
    logLevel: env.TRUSTTRACE_LOG_LEVEL?.trim() || "info",
  };
}

function readPort(value: string | undefined): number {
  if (value === undefined || value.trim() === "") return 8000;

  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("TRUSTTRACE_PORT must be an integer from 1 to 65535.");
  }

  return port;
}
