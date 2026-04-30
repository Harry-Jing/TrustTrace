/**
 * HTTP / SSE client for the TrustTrace backend.
 *
 * Every backend response is validated against the shared Zod schemas
 * in `packages/contracts` before it leaves this module — never trust
 * raw JSON. SSE subscriptions also live here; the composable layer
 * reacts to events but does not own the connection lifecycle (open,
 * reconnect backoff, close on terminal status).
 */

import { apiBaseUrl } from "@/app/env";
import {
  checkListResponseSchema,
  checkRecordSchema,
  createCheckResponseSchema,
  parseBackendPayload,
  progressEventSchema,
} from "@/features/checks/api/backendCheckSchemas";
import type {
  CheckEventHandlers,
  CheckEventSubscription,
  CheckEventSubscriptionOptions,
  CheckInputDraft,
  CheckListItem,
  CheckListParams,
  CheckRecord,
  CreateCheckResponse,
} from "@/features/checks/types";
import type { DiscoveryStrategy } from "@/features/checks/types/progress";

// SSE reconnect backoff: three attempts on EventSource error before
// the subscription gives up and reports a closed stream. Covers a
// transient proxy reset (~1–2s) without masking a sustained outage.
// The composable's poll fallback takes over after the last attempt.
const STREAM_RECONNECT_DELAYS_MS = [500, 1000, 2000] as const;

class HttpApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "HttpApiError";
    this.status = status;
  }
}

function apiUrl(path: string) {
  return `${apiBaseUrl.replace(/\/$/, "")}${path}`;
}

function resolveEventsUrl(checkId: string, eventsUrl?: string) {
  if (!eventsUrl) return apiUrl(`/checks/${encodeURIComponent(checkId)}/events`);

  if (/^https?:\/\//.test(eventsUrl) || eventsUrl.startsWith("/")) {
    return eventsUrl;
  }

  return apiUrl(`/${eventsUrl.replace(/^\/+/, "")}`);
}

function appendAfterSeq(url: string, afterSeq: number) {
  if (afterSeq <= 0) return url;

  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}afterSeq=${encodeURIComponent(String(afterSeq))}`;
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function readString(source: Record<string, unknown>, key: string, fallback = "") {
  const value = source[key];
  return typeof value === "string" ? value : fallback;
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error("Backend returned invalid JSON.");
  }
}

async function requestJson(path: string, init?: RequestInit): Promise<unknown> {
  const headers = new Headers(init?.headers);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  if (init?.body !== undefined && init.body !== null && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(apiUrl(path), {
    ...init,
    headers,
  });
  const body = await readJson(response);

  if (!response.ok) {
    const errorBody = asObject(body);
    throw new HttpApiError(
      readString(errorBody, "message", `Request failed with status ${String(response.status)}.`),
      response.status,
    );
  }

  return body;
}

function toCreateCheckResponse(value: unknown): CreateCheckResponse {
  return parseBackendPayload(createCheckResponseSchema, value, "createCheck response");
}

function toCheckRecord(value: unknown): CheckRecord {
  return parseBackendPayload(checkRecordSchema, value, "check record");
}

export async function createCheck(
  input: CheckInputDraft,
  discoveryStrategy: DiscoveryStrategy,
): Promise<CreateCheckResponse> {
  const body = await requestJson("/checks", {
    method: "POST",
    body: JSON.stringify({
      input: {
        type: input.mode,
        content: input.value,
      },
      discoveryStrategy,
    }),
  });

  return toCreateCheckResponse(body);
}

export async function getCheck(checkId: string): Promise<CheckRecord> {
  return toCheckRecord(await requestJson(`/checks/${encodeURIComponent(checkId)}`));
}

export async function listChecks(params?: CheckListParams): Promise<readonly CheckListItem[]> {
  const query = new URLSearchParams();
  if (params?.limit != null) query.set("limit", String(params.limit));
  if (params?.offset != null) query.set("offset", String(params.offset));
  const qs = query.toString();
  return parseBackendPayload(
    checkListResponseSchema,
    await requestJson(`/checks${qs ? `?${qs}` : ""}`),
    "check list",
  );
}

/**
 * Open an SSE subscription for a single check's progress events.
 *
 * If `EventSource` is unavailable, schedules a microtask `onError`
 * with an explanatory error and returns a no-op subscription — the
 * calling composable is expected to fall back to polling. Reconnect
 * backoff is bounded by {@link STREAM_RECONNECT_DELAYS_MS}; after
 * the last attempt fails the subscription closes and reports
 * "Lost connection to the check progress stream." via `onError`.
 *
 * Pass `options.afterSeq` to resume after a known sequence — the
 * server replays missed events from persistence on connect, so the
 * subscriber sees no gaps.
 */
export function subscribeCheckEvents(
  checkId: string,
  handlers: CheckEventHandlers,
  options: CheckEventSubscriptionOptions = {},
): CheckEventSubscription {
  if (typeof EventSource === "undefined") {
    queueMicrotask(() =>
      handlers.onError?.(new Error("EventSource is not available in this browser.")),
    );
    return { close() {} };
  }

  const baseEventsUrl = resolveEventsUrl(checkId, options.eventsUrl);
  let eventSource: EventSource | null = null;
  let closed = false;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let reconnectAttempt = 0;
  let lastSeq = options.afterSeq ?? 0;

  function clearReconnectTimer() {
    if (!reconnectTimer) return;
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  function closeCurrentStream() {
    eventSource?.close();
    eventSource = null;
  }

  function close(notify = true) {
    if (closed) return;
    closed = true;
    clearReconnectTimer();
    closeCurrentStream();
    if (notify) handlers.onClose?.();
  }

  function handleMessage(event: MessageEvent<string>) {
    try {
      const progressEvent = parseBackendPayload(
        progressEventSchema,
        JSON.parse(event.data) as unknown,
        "progress event",
      );
      if (progressEvent.seq <= lastSeq) return;

      lastSeq = progressEvent.seq;
      reconnectAttempt = 0;
      handlers.onEvent?.(progressEvent);

      if (progressEvent.status === "completed" || progressEvent.status === "failed") {
        close();
      }
    } catch (error) {
      handlers.onError?.(error);
      close();
    }
  }

  function openStream() {
    if (closed) return;

    closeCurrentStream();
    eventSource = new EventSource(appendAfterSeq(baseEventsUrl, lastSeq));
    eventSource.addEventListener("progress", handleMessage);
    eventSource.onmessage = handleMessage;
    eventSource.onerror = () => {
      if (closed) return;

      closeCurrentStream();
      const delay = STREAM_RECONNECT_DELAYS_MS[reconnectAttempt];

      if (delay !== undefined) {
        reconnectAttempt += 1;
        reconnectTimer = setTimeout(openStream, delay);
        return;
      }

      handlers.onError?.(new Error("Lost connection to the check progress stream."));
      close();
    };
  }

  openStream();

  return { close };
}
