import { fileURLToPath } from "node:url";

export type OpenAIReasoningEffort = "none" | "minimal" | "low" | "medium" | "high" | "xhigh";

export interface ServerConfig {
  port: number;
  dbPath: string;
  logLevel: string;
  openAiApiKey: string | null;
  openAiModel: string;
  openAiReasoningEffort: OpenAIReasoningEffort;
  maxCandidateSources: number;
  maxEvidenceSources: number;
}

const DEFAULT_DB_PATH = fileURLToPath(new URL("../data/trusttrace.sqlite", import.meta.url));

export function readConfig(env: Record<string, string | undefined> = Bun.env): ServerConfig {
  return {
    port: readPort(env.TRUSTTRACE_PORT),
    dbPath: env.TRUSTTRACE_DB_PATH?.trim() || DEFAULT_DB_PATH,
    logLevel: env.TRUSTTRACE_LOG_LEVEL?.trim() || "info",
    openAiApiKey: readOptionalString(env.OPENAI_API_KEY),
    openAiModel: env.TRUSTTRACE_OPENAI_MODEL?.trim() || "gpt-5.5",
    openAiReasoningEffort: readReasoningEffort(env.TRUSTTRACE_OPENAI_REASONING_EFFORT),
    maxCandidateSources: readPositiveInteger(env.TRUSTTRACE_MAX_CANDIDATE_SOURCES, 10, {
      name: "TRUSTTRACE_MAX_CANDIDATE_SOURCES",
      max: 25,
    }),
    maxEvidenceSources: readPositiveInteger(env.TRUSTTRACE_MAX_EVIDENCE_SOURCES, 6, {
      name: "TRUSTTRACE_MAX_EVIDENCE_SOURCES",
      max: 10,
    }),
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

function readOptionalString(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function readReasoningEffort(value: string | undefined): OpenAIReasoningEffort {
  if (value === undefined || value.trim() === "") return "low";

  const effort = value.trim();
  if (
    effort === "none" ||
    effort === "minimal" ||
    effort === "low" ||
    effort === "medium" ||
    effort === "high" ||
    effort === "xhigh"
  ) {
    return effort;
  }

  throw new Error(
    'TRUSTTRACE_OPENAI_REASONING_EFFORT must be one of "none", "minimal", "low", "medium", "high", or "xhigh".',
  );
}

function readPositiveInteger(
  value: string | undefined,
  fallback: number,
  options: { name: string; max: number },
): number {
  if (value === undefined || value.trim() === "") return fallback;

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > options.max) {
    throw new Error(`${options.name} must be an integer from 1 to ${String(options.max)}.`);
  }

  return parsed;
}
