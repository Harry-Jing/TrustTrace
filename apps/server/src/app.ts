import { Hono, type Context } from "hono";
import type { Logger } from "pino";
import { z } from "zod";
import { createCheckRequestSchema } from "@trusttrace/contracts/checks";

import { ProgressEventBus } from "./events";
import { EvidencePipeline } from "./pipeline/EvidencePipeline";
import { toCreateCheckResponse } from "./repositories/mappers/checkMapper";
import { ChecksRepository } from "./repositories/repositoryFacade";
import type { CheckStatus, ProgressEventDto } from "./types/checks";

const SSE_HEARTBEAT_INTERVAL_MS = 8_000;

export interface AppServices {
  repository: ChecksRepository;
  events: ProgressEventBus;
  pipeline: EvidencePipeline;
  logger: Logger;
}

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

const eventsQuerySchema = z.object({
  afterSeq: z.coerce.number().int().min(0).default(0),
});

export function createApp(services: AppServices): Hono {
  const app = new Hono();

  app.onError((error, c) => {
    services.logger.error({ error }, "Unhandled API error");
    return c.json({ code: "INTERNAL_ERROR", message: "Internal server error." }, 500);
  });

  app.get("/v1/health", (c) => c.json({ status: "ok" }));

  app.post("/v1/checks", async (c) => {
    const body = await readJsonBody(c);
    const parsed = createCheckRequestSchema.safeParse(body);

    if (!parsed.success) {
      return c.json(
        {
          code: "INVALID_CHECK_INPUT",
          message: parsed.error.issues.map((issue) => issue.message).join(" "),
        },
        400,
      );
    }

    const record = services.repository.createCheck(
      parsed.data.input,
      parsed.data.discoveryStrategy,
    );
    services.pipeline.start(record.checkId);

    return c.json(toCreateCheckResponse(record), 201);
  });

  app.get("/v1/checks", (c) => {
    const parsed = listQuerySchema.safeParse(c.req.query());

    if (!parsed.success) {
      return c.json({ code: "INVALID_LIST_QUERY", message: "Invalid check list query." }, 400);
    }

    return c.json({ items: services.repository.listChecks(parsed.data.limit, parsed.data.offset) });
  });

  app.get("/v1/checks/:checkId/events", (c) => {
    const checkId = c.req.param("checkId");
    const record = services.repository.getCheck(checkId);

    if (!record) {
      return c.json({ code: "CHECK_NOT_FOUND", message: "Check not found." }, 404);
    }

    const parsed = eventsQuerySchema.safeParse(c.req.query());
    if (!parsed.success) {
      return c.json({ code: "INVALID_EVENTS_QUERY", message: "Invalid events query." }, 400);
    }

    return streamProgressEvents(services, checkId, parsed.data.afterSeq, c.req.raw.signal);
  });

  app.get("/v1/checks/:checkId", (c) => {
    const record = services.repository.getCheck(c.req.param("checkId"));

    if (!record) {
      return c.json({ code: "CHECK_NOT_FOUND", message: "Check not found." }, 404);
    }

    return c.json(record);
  });

  return app;
}

async function readJsonBody(c: Context): Promise<unknown> {
  try {
    return (await c.req.json()) as unknown;
  } catch {
    return null;
  }
}

function streamProgressEvents(
  services: AppServices,
  checkId: string,
  afterSeq: number,
  signal: AbortSignal,
): Response {
  const encoder = new TextEncoder();
  let cleanup: (() => void) | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let lastSentSeq = afterSeq;
      let isClosed = false;
      let unsubscribe: (() => void) | null = null;
      let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

      const finish = () => {
        if (isClosed) return;
        isClosed = true;
        if (heartbeatTimer) {
          clearInterval(heartbeatTimer);
          heartbeatTimer = null;
        }
        unsubscribe?.();
        try {
          controller.close();
        } catch {
          // Stream may already be closed by the client.
        }
      };

      const sendEvent = (event: ProgressEventDto) => {
        if (isClosed || event.seq <= lastSentSeq) return;
        lastSentSeq = event.seq;
        controller.enqueue(encoder.encode(formatSseEvent(event)));
        if (isFinalStatus(event.status)) finish();
      };

      heartbeatTimer = setInterval(() => {
        if (isClosed) return;

        try {
          controller.enqueue(encoder.encode(": keep-alive\n\n"));
        } catch {
          finish();
        }
      }, SSE_HEARTBEAT_INTERVAL_MS);
      unsubscribe = services.events.subscribe(checkId, sendEvent);
      cleanup = finish;
      signal.addEventListener("abort", finish, { once: true });

      for (const event of services.repository.listEventsAfter(checkId, afterSeq)) {
        sendEvent(event);
      }

      const record = services.repository.getCheck(checkId);
      if (record && isFinalStatus(record.status) && record.progress.eventSeq <= lastSentSeq) {
        finish();
      }
    },
    cancel() {
      cleanup?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

function formatSseEvent(event: ProgressEventDto): string {
  return `event: progress\ndata: ${JSON.stringify(event)}\n\n`;
}

function isFinalStatus(status: CheckStatus): boolean {
  return status === "completed" || status === "failed";
}
