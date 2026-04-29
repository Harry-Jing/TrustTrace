import { readActiveScenario } from "@/dev/scenarioState";
import type { DevScenario } from "@/dev/scenarios";
import { CHECK_RESULT, DEMO_CHECK_IDS, DEMO_CHECKS } from "@/features/checks/fixtures/demoChecks";
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
} from "@/features/checks/types";
import type { DiscoveryStrategy } from "@/features/checks/types/progress";

/**
 * MOCK ONLY — In-memory API client used for local demo/debug flows.
 *
 * Behavior is driven entirely by the active dev scenario (see `@/dev/scenarios`).
 * The scenario decides which progress steps emit, how fast they emit, and what
 * terminal outcome (completed vs failed-with-error) is reached. The shape of
 * the records returned matches the real backend so the rest of the app cannot
 * tell mock from real.
 */

const INITIAL_PHASE: CheckPhase = "understanding";
const INITIAL_PERCENT = 8;
const INITIAL_MESSAGE = "Reading the input and parsing it into checkable claims.";

const FALLBACK_FAILURE: CheckApiError = {
  code: "PROVIDER_TIMEOUT",
  category: "provider timeout",
  message: "The provider took too long.",
  retryable: true,
  traceId: null,
  occurredAt: "",
};

const mockRecords = new Map<string, CheckRecord>();
const mockInputs = new Map<string, CheckInputDraft>();
const mockScenarioByCheckId = new Map<string, DevScenario>();
const knownDemoCheckIds = DEMO_CHECK_IDS;
const MAX_NON_DEMO_RECORDS = 50;
let mockIdSequence = 0;

function resolveMock<T>(value: T): Promise<T> {
  return Promise.resolve(value);
}

function nowIso() {
  return new Date().toISOString();
}

function statusForPhase(phase: CheckPhase): CheckStatus {
  if (phase === "completed") return "completed";
  if (phase === "failed") return "failed";
  return "running";
}

function makeCheckId() {
  mockIdSequence += 1;
  return `mock-check-${Date.now().toString(36)}-${mockIdSequence.toString(36)}`;
}

function makeProgress(
  checkId: string,
  step: { phase: CheckPhase; percent: number; message: string },
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
  };
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
  };
}

function rememberMockRecord(checkId: string, record: CheckRecord) {
  mockRecords.set(checkId, record);

  const nonDemoIds = [...mockRecords.keys()].filter((id) => !knownDemoCheckIds.has(id));
  while (nonDemoIds.length > MAX_NON_DEMO_RECORDS) {
    const oldestId = nonDemoIds.shift();
    if (!oldestId) return;
    mockRecords.delete(oldestId);
    mockInputs.delete(oldestId);
    mockScenarioByCheckId.delete(oldestId);
  }
}

function makeResultForCheck(checkId: string, input?: CheckInputDraft): CheckResultViewModel {
  const inputText =
    input === undefined || input.value.length === 0 ? CHECK_RESULT.inputText : input.value;
  const inputTypeLabel = input === undefined ? CHECK_RESULT.inputTypeLabel : `${input.mode} input`;

  return {
    ...CHECK_RESULT,
    checkId,
    inputText,
    inputTypeLabel,
    summaryText: `TrustTrace check: "${inputText}"\n\nVerdict: ${CHECK_RESULT.headline}\nEvidence: ${String(CHECK_RESULT.evidence.length)} sources · ${String(CHECK_RESULT.atAGlance.independent)} independent · ${String(CHECK_RESULT.atAGlance.primary)} primary · ${String(CHECK_RESULT.atAGlance.snippet)} snippet-only\nUncertainty: ${CHECK_RESULT.atAGlance.uncertainty}`,
  };
}

function makeCompletedRecord(checkId: string, input?: CheckInputDraft): CheckRecord {
  const completedAt = nowIso();
  const progress = makeProgress(
    checkId,
    { phase: "completed", percent: 100, message: "Check complete." },
    Number.MAX_SAFE_INTEGER,
    completedAt,
  );

  return {
    checkId,
    status: "completed",
    discoveryStrategy: "search_api",
    input: input ?? null,
    progress,
    result: makeResultForCheck(checkId, input),
    error: null,
    createdAt: completedAt,
    updatedAt: completedAt,
    completedAt,
  };
}

function buildScenarioError(scenario: DevScenario, checkId: string): CheckApiError {
  if (scenario.outcome.type === "completed") {
    return { ...FALLBACK_FAILURE, occurredAt: nowIso() };
  }
  const occurredAt = nowIso();
  const seed = scenario.outcome.error.traceIdSeed;
  return {
    code: scenario.outcome.error.code,
    category: scenario.outcome.error.category,
    message: scenario.outcome.error.message,
    retryable: scenario.outcome.error.retryable,
    traceId: `${seed}-${checkId.slice(-6)}`,
    occurredAt,
  };
}

function makeFailedRecord(checkId: string, scenario: DevScenario): CheckRecord {
  const failedAt = nowIso();
  const progress = makeProgress(
    checkId,
    { phase: "failed", percent: 100, message: "Check failed." },
    Number.MAX_SAFE_INTEGER,
    failedAt,
  );

  return {
    checkId,
    status: "failed",
    discoveryStrategy: "search_api",
    input: mockInputs.get(checkId) ?? null,
    progress,
    result: null,
    error: buildScenarioError(scenario, checkId),
    createdAt: failedAt,
    updatedAt: failedAt,
    completedAt: null,
  };
}

function makeNotFoundRecord(checkId: string): CheckRecord {
  const failedAt = nowIso();
  const progress = makeProgress(
    checkId,
    { phase: "failed", percent: 100, message: "Check not found." },
    1,
    failedAt,
  );
  const error: CheckApiError = {
    code: "CHECK_NOT_FOUND",
    category: "not found",
    message: "No mock check record exists for this ID.",
    retryable: false,
    traceId: null,
    occurredAt: failedAt,
  };

  return {
    checkId,
    status: "failed",
    discoveryStrategy: "search_api",
    input: null,
    progress,
    result: null,
    error,
    createdAt: failedAt,
    updatedAt: failedAt,
    completedAt: null,
  };
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
  };
}

function applyProgress(checkId: string, progress: CheckProgress) {
  const existing = mockRecords.get(checkId) ?? makeNotFoundRecord(checkId);
  const nextRecord: CheckRecord = {
    ...existing,
    status: progress.status,
    progress,
    updatedAt: progress.updatedAt,
    completedAt: progress.status === "completed" ? progress.updatedAt : existing.completedAt,
    result:
      progress.status === "completed"
        ? makeResultForCheck(checkId, mockInputs.get(checkId))
        : existing.result,
  };

  rememberMockRecord(checkId, nextRecord);
}

function ensureScenario(checkId: string): DevScenario {
  const existing = mockScenarioByCheckId.get(checkId);
  if (existing) return existing;
  const scenario = readActiveScenario();
  mockScenarioByCheckId.set(checkId, scenario);
  return scenario;
}

function rememberScenario(checkId: string, scenario: DevScenario) {
  mockScenarioByCheckId.set(checkId, scenario);
}

export function createCheck(
  input: CheckInputDraft,
  discoveryStrategy: DiscoveryStrategy,
): Promise<CreateCheckResponse> {
  const checkId = makeCheckId();
  const createdAt = nowIso();
  const scenario = readActiveScenario();
  rememberScenario(checkId, scenario);

  const initialProgress = makeProgress(
    checkId,
    { phase: INITIAL_PHASE, percent: INITIAL_PERCENT, message: INITIAL_MESSAGE },
    1,
    createdAt,
  );

  mockInputs.set(checkId, input);
  rememberMockRecord(checkId, {
    checkId,
    status: "running",
    discoveryStrategy,
    input,
    progress: initialProgress,
    result: null,
    error: null,
    createdAt,
    updatedAt: createdAt,
    completedAt: null,
  });

  return resolveMock({
    checkId,
    status: "running",
    discoveryStrategy,
    progress: initialProgress,
    eventsUrl: `/v1/checks/${checkId}/events`,
    createdAt,
  });
}

export function getCheck(checkId: string): Promise<CheckRecord> {
  const existing = mockRecords.get(checkId);

  if (existing) {
    return resolveMock(cloneRecord(existing));
  }

  const fallback = knownDemoCheckIds.has(checkId)
    ? makeCompletedRecord(checkId)
    : makeNotFoundRecord(checkId);
  rememberMockRecord(checkId, fallback);
  return resolveMock(cloneRecord(fallback));
}

/**
 * MOCK ONLY — Reset a mock check record to the initial phase under the
 * currently-active scenario so the loading page can be inspected from the
 * beginning. Re-snapshots the scenario, so a "switch scenario then replay"
 * flow picks up the new scenario on the next subscribe.
 */
export function devResetCheckProgress(checkId: string): void {
  const createdAt = nowIso();
  const scenario = readActiveScenario();
  rememberScenario(checkId, scenario);

  const initialProgress = makeProgress(
    checkId,
    { phase: INITIAL_PHASE, percent: INITIAL_PERCENT, message: INITIAL_MESSAGE },
    1,
    createdAt,
  );

  rememberMockRecord(checkId, {
    checkId,
    status: "running",
    discoveryStrategy: "search_api",
    input: mockInputs.get(checkId) ?? null,
    progress: initialProgress,
    result: null,
    error: null,
    createdAt,
    updatedAt: createdAt,
    completedAt: null,
  });
}

/**
 * MOCK ONLY — Force a mock check into a failed state. Uses the scenario's
 * error if it has one, otherwise falls back to PROVIDER_TIMEOUT.
 */
export function devSetCheckFailed(checkId: string): void {
  const scenario = ensureScenario(checkId);
  rememberMockRecord(checkId, makeFailedRecord(checkId, scenario));
}

/** MOCK ONLY — Force a mock check into a completed state with the demo result. */
export function devSetCheckCompleted(checkId: string): void {
  const completedAt = nowIso();
  const progress = makeProgress(
    checkId,
    { phase: "completed", percent: 100, message: "Check complete." },
    Number.MAX_SAFE_INTEGER,
    completedAt,
  );
  applyProgress(checkId, progress);
}

export function listChecks(params?: CheckListParams): Promise<readonly CheckListItem[]> {
  const limit = params?.limit ?? DEMO_CHECKS.length;
  const offset = params?.offset ?? 0;
  return resolveMock(DEMO_CHECKS.slice(offset, offset + limit));
}

export function subscribeCheckEvents(
  checkId: string,
  handlers: CheckEventHandlers,
  _options?: CheckEventSubscriptionOptions,
): CheckEventSubscription {
  const timers: ReturnType<typeof setTimeout>[] = [];
  let closed = false;

  const existing = mockRecords.get(checkId);

  if (existing && (existing.status === "completed" || existing.status === "failed")) {
    const timer = setTimeout(() => {
      if (closed) return;
      handlers.onEvent?.(makeEvent(existing.progress));
      handlers.onClose?.();
    }, 0);
    timers.push(timer);

    return {
      close() {
        closed = true;
        timers.forEach(clearTimeout);
      },
    };
  }

  const scenario = ensureScenario(checkId);
  const stepDelay = scenario.stepDelayMs;

  const playbackSteps =
    scenario.steps.length > 0
      ? scenario.steps
      : ([] as readonly { phase: CheckPhase; percent: number; message: string }[]);

  const timeline: { stepIndex: number; delay: number }[] = playbackSteps.map((_, index) => ({
    stepIndex: index,
    delay: index * stepDelay,
  }));

  // After all scenario steps replay, apply the terminal outcome (the steps
  // already include `completed` for successful flows; failed scenarios apply
  // the failure here).
  const lastStep = playbackSteps[playbackSteps.length - 1];
  const lastIsTerminal =
    lastStep !== undefined && (lastStep.phase === "completed" || lastStep.phase === "failed");

  const lastTick = timeline[timeline.length - 1];
  let finalDelay = lastTick === undefined ? 0 : lastTick.delay + stepDelay;

  if (scenario.outcome.type === "failed" && !lastIsTerminal) {
    timers.push(
      setTimeout(() => {
        if (closed) return;
        const failedRecord = makeFailedRecord(checkId, scenario);
        rememberMockRecord(checkId, failedRecord);
        handlers.onEvent?.(makeEvent(failedRecord.progress));
        handlers.onClose?.();
      }, finalDelay),
    );
    finalDelay += stepDelay;
  }

  for (const tick of timeline) {
    const step = playbackSteps[tick.stepIndex];
    if (!step) continue;
    const seq = tick.stepIndex + 1;

    timers.push(
      setTimeout(() => {
        if (closed) return;
        try {
          const progress = makeProgress(checkId, step, seq);
          applyProgress(checkId, progress);
          handlers.onEvent?.(makeEvent(progress));
          if (progress.status === "completed" || progress.status === "failed") {
            handlers.onClose?.();
          }
        } catch (error) {
          handlers.onError?.(error);
        }
      }, tick.delay),
    );
  }

  // Edge: scenario has no steps and outcome is completed (instant happy).
  if (playbackSteps.length === 0 && scenario.outcome.type === "completed") {
    timers.push(
      setTimeout(() => {
        if (closed) return;
        const completedAt = nowIso();
        const progress = makeProgress(
          checkId,
          { phase: "completed", percent: 100, message: "Check complete." },
          1,
          completedAt,
        );
        applyProgress(checkId, progress);
        handlers.onEvent?.(makeEvent(progress));
        handlers.onClose?.();
      }, 0),
    );
  }

  return {
    close() {
      closed = true;
      timers.forEach(clearTimeout);
    },
  };
}
