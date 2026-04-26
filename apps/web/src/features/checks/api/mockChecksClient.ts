import { CHECK_RESULT, DEMO_CHECK_IDS, DEMO_CHECKS } from '@/features/checks/fixtures/demoChecks'
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

/**
 * MOCK ONLY — In-memory API client used for local demo/debug flows.
 * Backend API calls live in backendChecksClient.ts and are selected via apiMode.
 */

interface MockProgressStep {
  phase: CheckPhase
  percent: number
  message: string
  delayMs: number
}

const MOCK_PROGRESS_SCRIPT = [
  {
    phase: 'understanding',
    percent: 8,
    message: 'Reading the input and parsing it into checkable claims.',
    delayMs: 0,
  },
  {
    phase: 'strategy',
    percent: 22,
    message: 'Picking source priorities and drafting queries.',
    delayMs: 180,
  },
  {
    phase: 'discovery',
    percent: 42,
    message: 'Searching trusted sources for this claim.',
    delayMs: 360,
  },
  {
    phase: 'verify_read',
    percent: 62,
    message: 'Verifying URLs and pulling article bodies.',
    delayMs: 540,
  },
  {
    phase: 'weigh',
    percent: 80,
    message: 'Sorting and reading each verified source.',
    delayMs: 720,
  },
  {
    phase: 'verdict',
    percent: 94,
    message: 'Composing the explanation from verified evidence.',
    delayMs: 900,
  },
  {
    phase: 'completed',
    percent: 100,
    message: 'Check complete.',
    delayMs: 1080,
  },
] as const satisfies readonly MockProgressStep[]

const INITIAL_PHASE: CheckPhase = 'understanding'
const INITIAL_MESSAGE = 'Reading the input and parsing it into checkable claims.'

const mockRecords = new Map<string, CheckRecord>()
const mockInputs = new Map<string, CheckInputDraft>()
const knownDemoCheckIds = DEMO_CHECK_IDS
const MAX_NON_DEMO_RECORDS = 50
let mockIdSequence = 0

function resolveMock<T>(value: T): Promise<T> {
  return Promise.resolve(value)
}

function nowIso() {
  return new Date().toISOString()
}

function statusForPhase(phase: CheckPhase): CheckStatus {
  if (phase === 'completed') return 'completed'
  if (phase === 'failed') return 'failed'
  return 'running'
}

function makeCheckId() {
  mockIdSequence += 1
  return `mock-check-${Date.now().toString(36)}-${mockIdSequence.toString(36)}`
}

function makeProgress(
  checkId: string,
  step: Pick<MockProgressStep, 'phase' | 'percent' | 'message'>,
  seq: number,
  updatedAt = nowIso(),
): CheckProgress {
  return {
    checkId,
    status: statusForPhase(step.phase),
    phase: step.phase,
    percent: step.percent,
    message: step.message,
    eventSeq: seq,
    updatedAt,
  }
}

function makeEvent(progress: CheckProgress): ProgressEvent {
  return {
    seq: progress.eventSeq,
    checkId: progress.checkId,
    status: progress.status,
    phase: progress.phase,
    percent: progress.percent,
    message: progress.message,
    provider: null,
    stepCode: `mock.${progress.phase}`,
    error: null,
    createdAt: progress.updatedAt,
  }
}

function rememberMockRecord(checkId: string, record: CheckRecord) {
  mockRecords.set(checkId, record)

  const nonDemoIds = [...mockRecords.keys()].filter((id) => !knownDemoCheckIds.has(id))
  while (nonDemoIds.length > MAX_NON_DEMO_RECORDS) {
    const oldestId = nonDemoIds.shift()
    if (!oldestId) return
    mockRecords.delete(oldestId)
    mockInputs.delete(oldestId)
  }
}

function makeResultForCheck(checkId: string, input?: CheckInputDraft): CheckResultViewModel {
  const inputText = input?.value || CHECK_RESULT.inputText
  const inputTypeLabel = input ? `${input.mode} input` : CHECK_RESULT.inputTypeLabel

  return {
    ...CHECK_RESULT,
    checkId,
    inputText,
    inputTypeLabel,
    summaryText: `TrustTrace check: "${inputText}"\n\nVerdict: ${CHECK_RESULT.headline}\nEvidence: ${CHECK_RESULT.evidence.length} sources · ${CHECK_RESULT.atAGlance.independent} independent · ${CHECK_RESULT.atAGlance.primary} primary · ${CHECK_RESULT.atAGlance.snippet} snippet-only\nUncertainty: ${CHECK_RESULT.atAGlance.uncertainty}`,
  }
}

function makeCompletedRecord(checkId: string, input?: CheckInputDraft): CheckRecord {
  const completedAt = nowIso()
  const progress = makeProgress(
    checkId,
    {
      phase: 'completed',
      percent: 100,
      message: 'Check complete.',
    },
    MOCK_PROGRESS_SCRIPT.length,
    completedAt,
  )

  return {
    checkId,
    status: 'completed',
    input: input ?? null,
    progress,
    result: makeResultForCheck(checkId, input),
    error: null,
    createdAt: completedAt,
    updatedAt: completedAt,
    completedAt,
  }
}

function makeFailedRecord(checkId: string): CheckRecord {
  const failedAt = nowIso()
  const progress = makeProgress(
    checkId,
    { phase: 'failed', percent: 100, message: 'Check failed.' },
    1,
    failedAt,
  )
  const error: CheckApiError = {
    code: 'PROVIDER_TIMEOUT',
    category: 'provider timeout',
    message: 'The provider took too long.',
    retryable: true,
    traceId: `${checkId.slice(0, 4)}…${checkId.slice(-4)}`,
    occurredAt: failedAt,
  }

  return {
    checkId,
    status: 'failed',
    input: mockInputs.get(checkId) ?? null,
    progress,
    result: null,
    error,
    createdAt: failedAt,
    updatedAt: failedAt,
    completedAt: null,
  }
}

function makeNotFoundRecord(checkId: string): CheckRecord {
  const failedAt = nowIso()
  const progress = makeProgress(
    checkId,
    { phase: 'failed', percent: 100, message: 'Check not found.' },
    1,
    failedAt,
  )
  const error: CheckApiError = {
    code: 'CHECK_NOT_FOUND',
    category: 'not found',
    message: 'No mock check record exists for this ID.',
    retryable: false,
    traceId: null,
    occurredAt: failedAt,
  }

  return {
    checkId,
    status: 'failed',
    input: null,
    progress,
    result: null,
    error,
    createdAt: failedAt,
    updatedAt: failedAt,
    completedAt: null,
  }
}

function cloneRecord(record: CheckRecord): CheckRecord {
  return {
    ...record,
    input: record.input ? { ...record.input } : null,
    progress: { ...record.progress },
    result: record.result
      ? {
          ...record.result,
          atAGlance: { ...record.result.atAGlance },
          cues: [...record.result.cues],
          evidence: [...record.result.evidence],
          uncertaintyLines: [...record.result.uncertaintyLines],
        }
      : null,
    error: record.error ? { ...record.error } : null,
  }
}

function applyProgress(checkId: string, progress: CheckProgress) {
  const existing = mockRecords.get(checkId) ?? makeNotFoundRecord(checkId)
  const nextRecord: CheckRecord = {
    ...existing,
    status: progress.status,
    progress,
    updatedAt: progress.updatedAt,
    completedAt: progress.status === 'completed' ? progress.updatedAt : existing.completedAt,
    result:
      progress.status === 'completed'
        ? makeResultForCheck(checkId, mockInputs.get(checkId))
        : existing.result,
  }

  rememberMockRecord(checkId, nextRecord)
}

export function createCheck(input: CheckInputDraft): Promise<CreateCheckResponse> {
  const checkId = makeCheckId()
  const createdAt = nowIso()
  const initialProgress = makeProgress(
    checkId,
    {
      phase: INITIAL_PHASE,
      percent: 8,
      message: INITIAL_MESSAGE,
    },
    1,
    createdAt,
  )

  mockInputs.set(checkId, input)
  rememberMockRecord(checkId, {
    checkId,
    status: 'running',
    input,
    progress: initialProgress,
    result: null,
    error: null,
    createdAt,
    updatedAt: createdAt,
    completedAt: null,
  })

  return resolveMock({
    checkId,
    status: 'running',
    progress: initialProgress,
    eventsUrl: `/v1/checks/${checkId}/events`,
    createdAt,
  })
}

export function getCheck(checkId: string): Promise<CheckRecord> {
  const existing = mockRecords.get(checkId)

  if (existing) {
    return resolveMock(cloneRecord(existing))
  }

  const fallback = knownDemoCheckIds.has(checkId)
    ? makeCompletedRecord(checkId)
    : makeNotFoundRecord(checkId)
  rememberMockRecord(checkId, fallback)
  return resolveMock(cloneRecord(fallback))
}

/**
 * MOCK ONLY — Reset a mock check record to its initial phase
 * so the loading page can be inspected from the beginning.
 */
export function devResetCheckProgress(checkId: string): void {
  const createdAt = nowIso()
  const initialProgress = makeProgress(
    checkId,
    { phase: INITIAL_PHASE, percent: 8, message: INITIAL_MESSAGE },
    1,
    createdAt,
  )

  rememberMockRecord(checkId, {
    checkId,
    status: 'running',
    input: mockInputs.get(checkId) ?? null,
    progress: initialProgress,
    result: null,
    error: null,
    createdAt,
    updatedAt: createdAt,
    completedAt: null,
  })
}

export function devSetCheckFailed(checkId: string): void {
  rememberMockRecord(checkId, makeFailedRecord(checkId))
}

export function listChecks(params?: CheckListParams): Promise<readonly CheckListItem[]> {
  const limit = params?.limit ?? DEMO_CHECKS.length
  const offset = params?.offset ?? 0
  return resolveMock(DEMO_CHECKS.slice(offset, offset + limit))
}

export function subscribeCheckEvents(
  checkId: string,
  handlers: CheckEventHandlers,
  _options?: CheckEventSubscriptionOptions,
): CheckEventSubscription {
  const timers: ReturnType<typeof setTimeout>[] = []
  let closed = false

  const existing = mockRecords.get(checkId)

  if (existing?.status === 'completed' || existing?.status === 'failed') {
    const timer = setTimeout(() => {
      if (closed) return
      handlers.onEvent?.(makeEvent(existing.progress))
      handlers.onClose?.()
    }, 0)
    timers.push(timer)

    return {
      close() {
        closed = true
        timers.forEach(clearTimeout)
      },
    }
  }

  MOCK_PROGRESS_SCRIPT.forEach((step, index) => {
    const timer = setTimeout(() => {
      if (closed) return

      try {
        const progress = makeProgress(checkId, step, index + 1)
        applyProgress(checkId, progress)
        handlers.onEvent?.(makeEvent(progress))

        if (progress.status === 'completed' || progress.status === 'failed') {
          handlers.onClose?.()
        }
      } catch (error) {
        handlers.onError?.(error)
      }
    }, step.delayMs)

    timers.push(timer)
  })

  return {
    close() {
      closed = true
      timers.forEach(clearTimeout)
    },
  }
}
