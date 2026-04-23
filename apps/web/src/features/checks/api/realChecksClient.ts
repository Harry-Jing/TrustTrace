import { apiBaseUrl } from '@/app/env'
import type {
  CheckApiError,
  CheckEventHandlers,
  CheckEventSubscription,
  CheckHistoryItem,
  CheckInputDraft,
  CheckPhase,
  CheckProgress,
  CheckRecord,
  CheckResult,
  CheckStatus,
  CreateCheckResponse,
  ProgressEvent,
  RecentCheckItem,
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

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function readString(source: Record<string, unknown>, keys: readonly string[], fallback = '') {
  for (const key of keys) {
    const value = source[key]
    if (typeof value === 'string') return value
  }

  return fallback
}

function readNumber(source: Record<string, unknown>, keys: readonly string[], fallback = 0) {
  for (const key of keys) {
    const value = source[key]
    if (typeof value === 'number' && Number.isFinite(value)) return value
  }

  return fallback
}

function readNullableString(source: Record<string, unknown>, keys: readonly string[]) {
  const value = readString(source, keys, '')
  return value || null
}

function readBoolean(source: Record<string, unknown>, keys: readonly string[], fallback = false) {
  for (const key of keys) {
    const value = source[key]
    if (typeof value === 'boolean') return value
  }

  return fallback
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
  const occurredAt = readString(source, ['occurredAt', 'occurred_at'], new Date().toISOString())

  return {
    code: readString(source, ['code'], 'UNKNOWN_ERROR'),
    category: readString(source, ['category'], 'unknown error'),
    message: readString(source, ['message'], 'The request failed.'),
    retryable: readBoolean(source, ['retryable'], false),
    traceId: readNullableString(source, ['traceId', 'trace_id']),
    occurredAt,
  }
}

function toCheckProgress(value: unknown, checkId: string): CheckProgress {
  const source = asObject(value)
  const status = coerceStatus(source.status)
  const phase = coercePhase(source.phase, status)

  return {
    checkId: readString(source, ['checkId', 'check_id'], checkId),
    status,
    phase,
    percent: readNumber(
      source,
      ['percent'],
      status === 'completed' || status === 'failed' ? 100 : 0,
    ),
    message: readString(
      source,
      ['message'],
      status === 'completed' ? 'Check complete.' : 'Check in progress.',
    ),
    eventSeq: readNumber(source, ['eventSeq', 'event_seq'], 0),
    updatedAt: readString(source, ['updatedAt', 'updated_at'], new Date().toISOString()),
  }
}

function toProgressEvent(value: unknown, fallbackCheckId: string): ProgressEvent {
  const source = asObject(value)
  const status = coerceStatus(source.status)
  const phase = coercePhase(source.phase, status)
  const createdAt = readString(source, ['createdAt', 'created_at'], new Date().toISOString())

  return {
    seq: readNumber(source, ['seq'], 0),
    checkId: readString(source, ['checkId', 'check_id'], fallbackCheckId),
    status,
    phase,
    percent: readNumber(
      source,
      ['percent'],
      status === 'completed' || status === 'failed' ? 100 : 0,
    ),
    message: readString(
      source,
      ['message'],
      status === 'completed' ? 'Check complete.' : 'Check in progress.',
    ),
    provider: readNullableString(source, ['provider']),
    stepCode: readNullableString(source, ['stepCode', 'step_code']),
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
      readString(errorBody, ['message'], `Request failed with status ${response.status}.`),
      response.status,
    )
  }

  return body
}

function toCreateCheckResponse(value: unknown): CreateCheckResponse {
  const source = asObject(value)
  const checkId = readString(source, ['checkId', 'check_id'])
  const createdAt = readString(source, ['createdAt', 'created_at'], new Date().toISOString())

  return {
    checkId,
    status: coerceStatus(source.status),
    progress: toCheckProgress(source.progress, checkId),
    eventsUrl: readString(source, ['eventsUrl', 'events_url'], `/v1/checks/${checkId}/events`),
    createdAt,
  }
}

function toCheckRecord(value: unknown): CheckRecord {
  const source = asObject(value)
  const checkId = readString(source, ['checkId', 'check_id'])
  const status = coerceStatus(source.status)

  return {
    checkId,
    status,
    progress: toCheckProgress(source.progress, checkId),
    result: source.result ? (source.result as CheckResult) : null,
    error: toCheckApiError(source.error),
    createdAt: readString(source, ['createdAt', 'created_at'], new Date().toISOString()),
    updatedAt: readString(source, ['updatedAt', 'updated_at'], new Date().toISOString()),
    completedAt: readNullableString(source, ['completedAt', 'completed_at']),
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

export async function getCheckHistory(): Promise<readonly CheckHistoryItem[]> {
  return readArray(await requestJson('/checks/history')) as readonly CheckHistoryItem[]
}

export async function getRecentChecks(): Promise<readonly RecentCheckItem[]> {
  return readArray(await requestJson('/checks/recent')) as readonly RecentCheckItem[]
}

export function subscribeCheckEvents(
  checkId: string,
  handlers: CheckEventHandlers,
): CheckEventSubscription {
  if (typeof EventSource === 'undefined') {
    queueMicrotask(() =>
      handlers.onError?.(new Error('EventSource is not available in this browser.')),
    )
    return { close() {} }
  }

  const eventSource = new EventSource(apiUrl(`/checks/${encodeURIComponent(checkId)}/events`))
  let closed = false

  function close() {
    if (closed) return
    closed = true
    eventSource.close()
    handlers.onClose?.()
  }

  function handleMessage(event: MessageEvent<string>) {
    try {
      const progressEvent = toProgressEvent(JSON.parse(event.data) as unknown, checkId)
      handlers.onEvent?.(progressEvent)

      if (progressEvent.status === 'completed' || progressEvent.status === 'failed') {
        close()
      }
    } catch (error) {
      handlers.onError?.(error)
      close()
    }
  }

  eventSource.addEventListener('progress', handleMessage)
  eventSource.onmessage = handleMessage
  eventSource.onerror = () => {
    handlers.onError?.(new Error('Lost connection to the check progress stream.'))
    close()
  }

  return { close }
}
