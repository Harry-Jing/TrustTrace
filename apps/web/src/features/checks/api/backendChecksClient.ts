import { apiBaseUrl } from '@/app/env'
import type {
  CheckApiError,
  CheckEventHandlers,
  CheckEventSubscription,
  CheckEventSubscriptionOptions,
  CheckInputDraft,
  CheckListItem,
  CheckListParams,
  CheckPhase,
  CheckProgress,
  CheckRecord,
  CheckResultViewModel,
  CheckStatus,
  CreateCheckResponse,
  ProgressEvent,
} from '@/features/checks/types'

const CHECK_STATUSES = new Set<CheckStatus>(['queued', 'running', 'completed', 'failed'])
const CHECK_PHASES = new Set<CheckPhase>([
  'accepted',
  'analyzing',
  'synthesizing',
  'persisting',
  'completed',
  'failed',
])
const STREAM_RECONNECT_DELAYS_MS = [500, 1000, 2000] as const

class HttpApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'HttpApiError'
    this.status = status
  }
}

function apiUrl(path: string) {
  return `${apiBaseUrl.replace(/\/$/, '')}${path}`
}

function resolveEventsUrl(checkId: string, eventsUrl?: string) {
  if (!eventsUrl) return apiUrl(`/checks/${encodeURIComponent(checkId)}/events`)

  if (/^https?:\/\//.test(eventsUrl) || eventsUrl.startsWith('/')) {
    return eventsUrl
  }

  return apiUrl(`/${eventsUrl.replace(/^\/+/, '')}`)
}

function appendAfterSeq(url: string, afterSeq: number) {
  if (afterSeq <= 0) return url

  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}afterSeq=${encodeURIComponent(String(afterSeq))}`
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function readString(source: Record<string, unknown>, key: string, fallback = '') {
  const value = source[key]
  return typeof value === 'string' ? value : fallback
}

function readNumber(source: Record<string, unknown>, key: string, fallback = 0) {
  const value = source[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function readNullableString(source: Record<string, unknown>, key: string) {
  const value = readString(source, key, '')
  return value || null
}

function readBoolean(source: Record<string, unknown>, key: string, fallback = false) {
  const value = source[key]
  return typeof value === 'boolean' ? value : fallback
}

function coerceStatus(value: unknown): CheckStatus {
  return typeof value === 'string' && CHECK_STATUSES.has(value as CheckStatus)
    ? (value as CheckStatus)
    : 'running'
}

function coercePhase(value: unknown, status: CheckStatus): CheckPhase {
  if (typeof value === 'string' && CHECK_PHASES.has(value as CheckPhase)) {
    return value as CheckPhase
  }

  if (status === 'completed') return 'completed'
  if (status === 'failed') return 'failed'
  return 'accepted'
}

function toCheckApiError(value: unknown): CheckApiError | null {
  if (!value) return null

  const source = asObject(value)
  const occurredAt = readString(source, 'occurredAt', new Date().toISOString())

  return {
    code: readString(source, 'code', 'UNKNOWN_ERROR'),
    category: readString(source, 'category', 'unknown error'),
    message: readString(source, 'message', 'The request failed.'),
    retryable: readBoolean(source, 'retryable', false),
    traceId: readNullableString(source, 'traceId'),
    occurredAt,
  }
}

function toCheckProgress(value: unknown, checkId: string): CheckProgress {
  const source = asObject(value)
  const status = coerceStatus(source.status)
  const phase = coercePhase(source.phase, status)

  return {
    checkId: readString(source, 'checkId', checkId),
    status,
    phase,
    percent: readNumber(source, 'percent', status === 'completed' || status === 'failed' ? 100 : 0),
    message: readString(
      source,
      'message',
      status === 'completed' ? 'Check complete.' : 'Check in progress.',
    ),
    eventSeq: readNumber(source, 'eventSeq', 0),
    updatedAt: readString(source, 'updatedAt', new Date().toISOString()),
  }
}

function toProgressEvent(value: unknown, fallbackCheckId: string): ProgressEvent {
  const source = asObject(value)
  const status = coerceStatus(source.status)
  const phase = coercePhase(source.phase, status)
  const createdAt = readString(source, 'createdAt', new Date().toISOString())

  return {
    seq: readNumber(source, 'seq', 0),
    checkId: readString(source, 'checkId', fallbackCheckId),
    status,
    phase,
    percent: readNumber(source, 'percent', status === 'completed' || status === 'failed' ? 100 : 0),
    message: readString(
      source,
      'message',
      status === 'completed' ? 'Check complete.' : 'Check in progress.',
    ),
    provider: readNullableString(source, 'provider'),
    stepCode: readNullableString(source, 'stepCode'),
    error: toCheckApiError(source.error),
    createdAt,
  }
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) return null

  try {
    return JSON.parse(text) as unknown
  } catch {
    throw new Error('Backend returned invalid JSON.')
  }
}

async function requestJson(path: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(apiUrl(path), {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  })
  const body = await readJson(response)

  if (!response.ok) {
    const errorBody = asObject(body)
    throw new HttpApiError(
      readString(errorBody, 'message', `Request failed with status ${response.status}.`),
      response.status,
    )
  }

  return body
}

function toCreateCheckResponse(value: unknown): CreateCheckResponse {
  const source = asObject(value)
  const checkId = readString(source, 'checkId')
  const createdAt = readString(source, 'createdAt', new Date().toISOString())

  return {
    checkId,
    status: coerceStatus(source.status),
    progress: toCheckProgress(source.progress, checkId),
    eventsUrl: readString(source, 'eventsUrl', `/v1/checks/${checkId}/events`),
    createdAt,
  }
}

function toCheckRecord(value: unknown): CheckRecord {
  const source = asObject(value)
  const checkId = readString(source, 'checkId')
  const status = coerceStatus(source.status)

  return {
    checkId,
    status,
    progress: toCheckProgress(source.progress, checkId),
    result: source.result ? (source.result as CheckResultViewModel) : null,
    error: toCheckApiError(source.error),
    createdAt: readString(source, 'createdAt', new Date().toISOString()),
    updatedAt: readString(source, 'updatedAt', new Date().toISOString()),
    completedAt: readNullableString(source, 'completedAt'),
  }
}

function readArray(value: unknown): readonly unknown[] {
  if (Array.isArray(value)) return value

  const source = asObject(value)
  for (const key of ['items', 'checks', 'recent']) {
    const maybeArray = source[key]
    if (Array.isArray(maybeArray)) return maybeArray
  }

  return []
}

export async function createCheck(input: CheckInputDraft): Promise<CreateCheckResponse> {
  const body = await requestJson('/checks', {
    method: 'POST',
    body: JSON.stringify({
      input: {
        type: input.mode,
        content: input.value,
      },
    }),
  })

  return toCreateCheckResponse(body)
}

export async function getCheck(checkId: string): Promise<CheckRecord> {
  return toCheckRecord(await requestJson(`/checks/${encodeURIComponent(checkId)}`))
}

export async function listChecks(params?: CheckListParams): Promise<readonly CheckListItem[]> {
  const query = new URLSearchParams()
  if (params?.limit != null) query.set('limit', String(params.limit))
  if (params?.offset != null) query.set('offset', String(params.offset))
  const qs = query.toString()
  return readArray(await requestJson(`/checks${qs ? `?${qs}` : ''}`)) as readonly CheckListItem[]
}

export function subscribeCheckEvents(
  checkId: string,
  handlers: CheckEventHandlers,
  options: CheckEventSubscriptionOptions = {},
): CheckEventSubscription {
  if (typeof EventSource === 'undefined') {
    queueMicrotask(() =>
      handlers.onError?.(new Error('EventSource is not available in this browser.')),
    )
    return { close() {} }
  }

  const baseEventsUrl = resolveEventsUrl(checkId, options.eventsUrl)
  let eventSource: EventSource | null = null
  let closed = false
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let reconnectAttempt = 0
  let lastSeq = options.afterSeq ?? 0

  function clearReconnectTimer() {
    if (!reconnectTimer) return
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }

  function closeCurrentStream() {
    eventSource?.close()
    eventSource = null
  }

  function close(notify = true) {
    if (closed) return
    closed = true
    clearReconnectTimer()
    closeCurrentStream()
    if (notify) handlers.onClose?.()
  }

  function handleMessage(event: MessageEvent<string>) {
    try {
      const progressEvent = toProgressEvent(JSON.parse(event.data) as unknown, checkId)
      if (progressEvent.seq <= lastSeq) return

      lastSeq = progressEvent.seq
      reconnectAttempt = 0
      handlers.onEvent?.(progressEvent)

      if (progressEvent.status === 'completed' || progressEvent.status === 'failed') {
        close()
      }
    } catch (error) {
      handlers.onError?.(error)
      close()
    }
  }

  function openStream() {
    if (closed) return

    closeCurrentStream()
    eventSource = new EventSource(appendAfterSeq(baseEventsUrl, lastSeq))
    eventSource.addEventListener('progress', handleMessage)
    eventSource.onmessage = handleMessage
    eventSource.onerror = () => {
      if (closed) return

      closeCurrentStream()
      const delay = STREAM_RECONNECT_DELAYS_MS[reconnectAttempt]

      if (delay !== undefined) {
        reconnectAttempt += 1
        reconnectTimer = setTimeout(openStream, delay)
        return
      }

      handlers.onError?.(new Error('Lost connection to the check progress stream.'))
      close()
    }
  }

  openStream()

  return { close }
}
