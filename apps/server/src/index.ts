import pino from "pino";

import { readConfig } from "./config";
import { createServices } from "./services";

const config = readConfig();
const logger = pino({ level: config.logLevel });
const services = createServices({ dbPath: config.dbPath, logger });

Bun.serve({
  port: config.port,
  fetch: services.app.fetch,
});

logger.info(
  {
    port: config.port,
    dbPath: config.dbPath,
  },
  "TrustTrace server listening",
);
