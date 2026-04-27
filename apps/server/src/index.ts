import pino from "pino";

import { readConfig } from "./config";
import { createServices } from "./services";

const config = readConfig();
const logger = pino({ level: config.logLevel });
const services = createServices({
  dbPath: config.dbPath,
  logger,
  openAiApiKey: config.openAiApiKey,
  openAiModel: config.openAiModel,
  openAiReasoningEffort: config.openAiReasoningEffort,
  maxCandidateSources: config.maxCandidateSources,
  maxEvidenceSources: config.maxEvidenceSources,
});

Bun.serve({
  port: config.port,
  fetch: services.app.fetch,
});

logger.info(
  {
    port: config.port,
    dbPath: config.dbPath,
    openAiModel: config.openAiModel,
    maxCandidateSources: config.maxCandidateSources,
    maxEvidenceSources: config.maxEvidenceSources,
  },
  "TrustTrace server listening",
);
