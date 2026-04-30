import { computed, onScopeDispose, ref, watch } from "vue";
import { useRoute } from "vue-router";

import { readActiveScenario } from "@/dev/scenarioState";
import { buildPhaseLookup } from "@/dev/scenarios";
import { getCheck, subscribeCheckEvents } from "@/features/checks/api/checksApi";
import {
  ACTIVE_PHASES,
  CHECK_PHASES,
  PHASE_DEFINITIONS,
} from "@/features/checks/constants/checkProgress";
import { useChecksStore } from "@/features/checks/stores/checks.store";
import type {
  ActiveCheckPhase,
  CheckEventSubscription,
  CheckEventSubscriptionOptions,
  CheckPhase,
  CheckProgress,
  CheckRecord,
  CheckStatus,
} from "@/features/checks/types";
import { readCheckId } from "@/features/checks/utils";
import { useAsyncData } from "@/shared/composables/useAsyncData";

const FINAL_ACTIVE_PHASE: ActiveCheckPhase = "verdict";

// Fallback poll interval used when SSE drops. 2s balances UI freshness
// against repeated GETs on a still-running check; the SSE retry chain
// in `backendChecksClient` already handles short blips before this fires.
const FALLBACK_POLL_INTERVAL_MS = 2_000;

function isActiveStatus(status: CheckStatus): boolean {
  return status === "queued" || status === "running";
}

function activePhaseIndexOf(phase: CheckPhase): number {
  if (phase === "failed" || phase === "completed") return ACTIVE_PHASES.length - 1;
  return Math.max(0, ACTIVE_PHASES.indexOf(phase));
}

function activePhase(phase: CheckPhase): ActiveCheckPhase {
  if (phase === "completed" || phase === "failed") {
    return FINAL_ACTIVE_PHASE;
  }
  return phase;
}

/**
 * MOCK DEV ONLY — Build a synthetic progress object for manual phase switching.
 *
 * Reads the active scenario so manual jumps see the same percent/message that
 * the auto-played stream would emit at that phase. Without this, the
 * "loading" page UI flips between "70%" (manual jump) and "62%" (auto-play)
 * for the same phase, which is jarring during dev.
 */
function makeDevProgress(checkId: string, phase: CheckPhase): CheckProgress {
  const phaseIndex = activePhaseIndexOf(phase);
  const updatedAt = new Date().toISOString();
  const scenarioLookup = buildPhaseLookup(readActiveScenario());

  if (phase === "completed") {
    return {
      checkId,
      status: "completed",
      phase,
      percent: 100,
      message: "Check complete.",
      eventSeq: phaseIndex + 1,
      updatedAt,
    };
  }

  if (phase === "failed") {
    return {
      checkId,
      status: "failed",
      phase,
      percent: 100,
      message: "Check failed.",
      eventSeq: phaseIndex + 1,
      updatedAt,
    };
  }

  const lookup = scenarioLookup[phase];
  return {
    checkId,
    status: "running",
    phase,
    percent: lookup.percent,
    message: lookup.message,
    eventSeq: phaseIndex + 1,
    updatedAt,
  };
}

/**
 * Reactive subscription to a single check's progress.
 *
 * Reads `:checkId` from the route, fetches the persisted record, then
 * subscribes to SSE for live progress events. On stream error, falls
 * back to polling the record every {@link FALLBACK_POLL_INTERVAL_MS}
 * until the check reaches a terminal status. Cleans up subscription
 * and timers on route change and on Vue scope disposal.
 *
 * In dev mode `setPhase()` synthesizes a progress object from the
 * active scenario, so the loading-page UI can be inspected without a
 * live backend. Manual phase jumps and auto-played stream events
 * therefore agree on the same percent/message at every phase.
 */
export function useCheckProgress() {
  const route = useRoute();
  const checks = useChecksStore();
  const progress = ref<CheckProgress | null>(null);
  const eventError = ref<unknown>(null);
  let subscription: CheckEventSubscription | null = null;
  let fallbackPollTimer: ReturnType<typeof setTimeout> | null = null;

  const checkId = computed(() => readCheckId(route.params.checkId));
  const recordState = useAsyncData(
    () => {
      if (!checkId.value) {
        return Promise.reject(new Error("Missing checkId route parameter"));
      }

      return getCheck(checkId.value);
    },
    { immediate: false },
  );

  function closeSubscription() {
    subscription?.close();
    subscription = null;
  }

  function clearFallbackPoll() {
    if (!fallbackPollTimer) return;
    clearTimeout(fallbackPollTimer);
    fallbackPollTimer = null;
  }

  function recordProgress(nextProgress: CheckProgress) {
    progress.value = nextProgress;
    checks.recordProgress(nextProgress);
  }

  function subscribe(checkIdToSubscribe: string) {
    closeSubscription();
    clearFallbackPoll();
    const eventsUrl = checks.eventsUrlByCheckId[checkIdToSubscribe];
    const subscriptionOptions: CheckEventSubscriptionOptions = {
      afterSeq: progress.value?.eventSeq ?? 0,
      ...(eventsUrl ? { eventsUrl } : {}),
    };

    subscription = subscribeCheckEvents(
      checkIdToSubscribe,
      {
        onEvent: (event) => {
          recordProgress({
            checkId: event.checkId,
            status: event.status,
            phase: event.phase,
            percent: event.percent,
            message: event.message,
            eventSeq: event.seq,
            updatedAt: event.createdAt,
          });
        },
        onError: () => {
          void handleStreamError(checkIdToSubscribe);
        },
      },
      subscriptionOptions,
    );
  }

  async function reloadRecordFor(checkIdToReload: string): Promise<CheckRecord | null> {
    const record = await recordState.reload();

    if (!record || checkId.value !== checkIdToReload) return null;

    recordProgress(record.progress);
    return record;
  }

  function scheduleFallbackPoll(checkIdToReload: string) {
    clearFallbackPoll();
    fallbackPollTimer = setTimeout(() => {
      fallbackPollTimer = null;
      void pollCheckRecord(checkIdToReload);
    }, FALLBACK_POLL_INTERVAL_MS);
  }

  async function pollCheckRecord(checkIdToReload: string) {
    const record = await reloadRecordFor(checkIdToReload);
    if (!record) return;

    eventError.value = null;

    if (isActiveStatus(record.status)) {
      scheduleFallbackPoll(checkIdToReload);
    }
  }

  async function handleStreamError(checkIdToReload: string) {
    const record = await reloadRecordFor(checkIdToReload);
    if (!record) return;

    eventError.value = null;

    if (isActiveStatus(record.status)) {
      scheduleFallbackPoll(checkIdToReload);
    }
  }

  async function loadCheckRecord(nextCheckId: string | null) {
    closeSubscription();
    clearFallbackPoll();
    progress.value = null;
    eventError.value = null;

    if (!nextCheckId) {
      await recordState.reload();
      return;
    }

    checks.setCurrentCheckId(nextCheckId);
    const record = await recordState.reload();

    if (!record || checkId.value !== nextCheckId) return;

    recordProgress(record.progress);

    if (isActiveStatus(record.status)) {
      subscribe(nextCheckId);
    }
  }

  watch(
    checkId,
    (nextCheckId) => {
      void loadCheckRecord(nextCheckId);
    },
    { immediate: true },
  );

  onScopeDispose(() => {
    closeSubscription();
    clearFallbackPoll();
  });

  const phase = computed<CheckPhase>(
    () => progress.value?.phase ?? recordState.data.value?.progress.phase ?? "understanding",
  );
  const status = computed(
    () => progress.value?.status ?? recordState.data.value?.status ?? "queued",
  );
  const phaseIndex = computed(() => activePhaseIndexOf(phase.value));
  const activePhaseKey = computed(() => activePhase(phase.value));
  const phaseDefinition = computed(() => PHASE_DEFINITIONS[activePhaseKey.value]);
  const progressError = computed(() => eventError.value ?? recordState.error.value);

  /** MOCK DEV ONLY — Manually override the current phase for dev inspection. */
  function setPhase(nextPhase: CheckPhase) {
    const currentCheckId = checkId.value ?? checks.currentCheckId ?? "demo-check";
    recordProgress(makeDevProgress(currentCheckId, nextPhase));
  }

  async function retry() {
    await loadCheckRecord(checkId.value);
  }

  return {
    checkId,
    phases: CHECK_PHASES,
    activePhases: ACTIVE_PHASES,
    status,
    phase,
    phaseIndex,
    activePhaseKey,
    phaseDefinition,
    progress,
    record: recordState.data,
    isLoading: recordState.isLoading,
    isError: recordState.isError,
    error: recordState.error,
    eventError,
    progressError,
    reload: recordState.reload,
    retry,
    setPhase,
  };
}
