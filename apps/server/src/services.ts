import pino, { type Logger } from "pino";

import { createApp } from "./app";
import type { OpenAIReasoningEffort } from "./config";
import { openDatabase, type OpenDatabaseResult } from "./database";
import { type EvidenceProvider, OpenAIEvidenceProvider } from "./evidenceProvider";
import { ProgressEventBus } from "./events";
import { EvidencePipeline } from "./pipeline";
import { ChecksRepository } from "./repository";
import type { SourceFetchOptions } from "./sourceSafety";

export interface CreateServicesOptions {
  dbPath: string;
  pipelineDelayMs?: number;
  logger?: Logger;
  evidenceProvider?: EvidenceProvider;
  sourceFetchOptions?: SourceFetchOptions;
  openAiApiKey?: string | null;
  openAiModel?: string;
  openAiReasoningEffort?: OpenAIReasoningEffort;
  maxCandidateSources?: number;
  maxEvidenceSources?: number;
}

export interface TrustTraceServices {
  app: ReturnType<typeof createApp>;
  database: OpenDatabaseResult;
  events: ProgressEventBus;
  repository: ChecksRepository;
  pipeline: EvidencePipeline;
  close: () => void;
}

export function createServices(options: CreateServicesOptions): TrustTraceServices {
  const logger = options.logger ?? pino({ level: "info" });
  const database = openDatabase(options.dbPath);
  const repository = new ChecksRepository(database.db);
  const events = new ProgressEventBus();
  const evidenceProvider =
    options.evidenceProvider ??
    new OpenAIEvidenceProvider({
      apiKey:
        options.openAiApiKey === undefined
          ? (Bun.env.OPENAI_API_KEY ?? null)
          : options.openAiApiKey,
      model: options.openAiModel ?? Bun.env.TRUSTTRACE_OPENAI_MODEL ?? "gpt-5.5",
      reasoningEffort: options.openAiReasoningEffort ?? "low",
    });
  const pipeline = new EvidencePipeline(repository, events, {
    logger,
    evidenceProvider,
    maxCandidateSources: options.maxCandidateSources ?? 10,
    maxEvidenceSources: options.maxEvidenceSources ?? 6,
    ...(options.sourceFetchOptions === undefined
      ? {}
      : { sourceFetchOptions: options.sourceFetchOptions }),
    ...(options.pipelineDelayMs === undefined ? {} : { delayMs: options.pipelineDelayMs }),
  });
  const app = createApp({ repository, events, pipeline, logger });

  return {
    app,
    database,
    events,
    repository,
    pipeline,
    close: database.close,
  };
}
