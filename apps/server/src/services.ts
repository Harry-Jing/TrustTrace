import pino, { type Logger } from "pino";

import { createApp } from "./app";
import type { OpenAIReasoningEffort } from "./config";
import { openDatabase, type OpenDatabaseResult } from "./database/openDatabase";
import { OpenAIEvidenceProvider } from "./evidenceProvider/OpenAIEvidenceProvider";
import type { EvidenceProvider } from "./evidenceProvider/types";
import { OpenAIWebSearchDiscoveryProvider } from "./sourceDiscovery/OpenAIWebSearchDiscoveryProvider";
import { TavilyDiscoveryProvider } from "./sourceDiscovery/TavilyDiscoveryProvider";
import type { SourceDiscoveryProvider } from "./sourceDiscovery/types";
import { ProgressEventBus } from "./events";
import { EvidencePipeline } from "./pipeline/EvidencePipeline";
import { ChecksRepository } from "./repositories/repositoryFacade";
import type { SourceFetchOptions } from "./sourceSafety/types";
import type { DiscoveryStrategy } from "./types/checks";

export interface CreateServicesOptions {
  dbPath: string;
  pipelineDelayMs?: number;
  logger?: Logger;
  evidenceProvider?: EvidenceProvider;
  discoveryProviders?: Record<DiscoveryStrategy, SourceDiscoveryProvider>;
  sourceFetchOptions?: SourceFetchOptions;
  openAiApiKey?: string | null;
  tavilyApiKey?: string | null;
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
  const discoveryProviders =
    options.discoveryProviders ??
    createDefaultDiscoveryProviders({
      openAiApiKey:
        options.openAiApiKey === undefined
          ? (Bun.env.OPENAI_API_KEY ?? null)
          : options.openAiApiKey,
      tavilyApiKey:
        options.tavilyApiKey === undefined
          ? (Bun.env.TAVILY_API_KEY ?? null)
          : options.tavilyApiKey,
      openAiModel: options.openAiModel ?? Bun.env.TRUSTTRACE_OPENAI_MODEL ?? "gpt-5.5",
      openAiReasoningEffort: options.openAiReasoningEffort ?? "low",
    });
  const pipeline = new EvidencePipeline(repository, events, {
    logger,
    evidenceProvider,
    discoveryProviders,
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

function createDefaultDiscoveryProviders(options: {
  openAiApiKey: string | null;
  tavilyApiKey: string | null;
  openAiModel: string;
  openAiReasoningEffort: OpenAIReasoningEffort;
}): Record<DiscoveryStrategy, SourceDiscoveryProvider> {
  return {
    search_api: new TavilyDiscoveryProvider({ apiKey: options.tavilyApiKey }),
    llm_web: new OpenAIWebSearchDiscoveryProvider({
      apiKey: options.openAiApiKey,
      model: options.openAiModel,
      reasoningEffort: options.openAiReasoningEffort,
    }),
  };
}
