import pino from "pino";

import { readConfig } from "./config";
import { createServices } from "./services";

const config = readConfig();
const logger = pino({ level: config.logLevel });
const services = createServices({
  dbPath: config.dbPath,
  logger,
  openAiApiKey: config.openAiApiKey,
  tavilyApiKey: config.tavilyApiKey,
  openAiModel: config.openAiModel,
  openAiReasoningEffort: config.openAiReasoningEffort,
  maxCandidateSources: config.maxCandidateSources,
  maxEvidenceSources: config.maxEvidenceSources,
});

Bun.serve({
  port: config.port,
  fetch(request, server) {
    if (isProgressEventsRequest(request)) {
      server.timeout(request, 0);
    }

    return services.app.fetch(request);
  },
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

function isProgressEventsRequest(request: Request): boolean {
  if (request.method !== "GET") return false;

  return /^\/v1\/checks\/[^/]+\/events$/.test(new URL(request.url).pathname);
}
