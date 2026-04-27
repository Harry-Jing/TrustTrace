import pino, { type Logger } from "pino";

import { createApp } from "./app";
import { openDatabase, type OpenDatabaseResult } from "./database";
import { ProgressEventBus } from "./events";
import { SimulatedPipeline } from "./pipeline";
import { ChecksRepository } from "./repository";

export interface CreateServicesOptions {
  dbPath: string;
  pipelineDelayMs?: number;
  logger?: Logger;
}

export interface TrustTraceServices {
  app: ReturnType<typeof createApp>;
  database: OpenDatabaseResult;
  events: ProgressEventBus;
  repository: ChecksRepository;
  pipeline: SimulatedPipeline;
  close: () => void;
}

export function createServices(options: CreateServicesOptions): TrustTraceServices {
  const logger = options.logger ?? pino({ level: Bun.env.TRUSTTRACE_LOG_LEVEL ?? "info" });
  const database = openDatabase(options.dbPath);
  const repository = new ChecksRepository(database.db);
  const events = new ProgressEventBus();
  const pipeline = new SimulatedPipeline(repository, events, {
    logger,
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
