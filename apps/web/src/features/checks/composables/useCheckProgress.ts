import { computed, onScopeDispose, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import { getCheck, subscribeCheckEvents } from '@/features/checks/api/checksApi'
import {
  ACTIVE_PHASES,
  CHECK_PHASES,
  PHASE_DEFINITIONS,
} from '@/features/checks/constants/checkProgress'
import { useChecksStore } from '@/features/checks/stores/checks.store'
import type {
  ActiveCheckPhase,
  CheckEventSubscription,
  CheckEventSubscriptionOptions,
  CheckPhase,
  CheckProgress,
} from '@/features/checks/types'
import { readCheckId } from '@/features/checks/utils'
import { useAsyncData } from '@/shared/composables/useAsyncData'

const FINAL_ACTIVE_PHASE: ActiveCheckPhase = 'verdict'

function activePhaseIndexOf(phase: CheckPhase): number {
  if (phase === 'failed' || phase === 'completed') return ACTIVE_PHASES.length - 1
  return Math.max(0, ACTIVE_PHASES.indexOf(phase))
}

function activePhase(phase: CheckPhase): ActiveCheckPhase {
  if (phase === 'completed' || phase === 'failed') {
    return FINAL_ACTIVE_PHASE
  }
  return phase
}

/** MOCK DEV ONLY — Build a synthetic progress object for manual phase switching. */
function makeDevProgress(checkId: string, phase: CheckPhase): CheckProgress {
  const phaseIndex = activePhaseIndexOf(phase)
  const percent =
    phase === 'failed'
      ? 100
      : phase === 'completed'
        ? 100
        : Math.max(8, Math.round(((phaseIndex + 1) / ACTIVE_PHASES.length) * 100))
  const updatedAt = new Date().toISOString()

  return {
    checkId,
    status: phase === 'failed' ? 'failed' : phase === 'completed' ? 'completed' : 'running',
    phase,
    percent,
    message: phase === 'completed' ? 'Check complete.' : '',
    eventSeq: phaseIndex + 1,
    updatedAt,
  }
}

export function useCheckProgress() {
  const route = useRoute()
  const checks = useChecksStore()
  const progress = ref<CheckProgress | null>(null)
  const eventError = ref<unknown>(null)
  let subscription: CheckEventSubscription | null = null

  const checkId = computed(() => readCheckId(route.params.checkId))
  const recordState = useAsyncData(
    () => {
      if (!checkId.value) {
        return Promise.reject(new Error('Missing checkId route parameter'))
      }

      return getCheck(checkId.value)
    },
    { immediate: false },
  )

  function closeSubscription() {
    subscription?.close()
    subscription = null
  }

  function recordProgress(nextProgress: CheckProgress) {
    progress.value = nextProgress
    checks.recordProgress(nextProgress)
  }

  function subscribe(checkIdToSubscribe: string) {
    closeSubscription()
    const eventsUrl = checks.eventsUrlByCheckId[checkIdToSubscribe]
    const subscriptionOptions: CheckEventSubscriptionOptions = {
      afterSeq: progress.value?.eventSeq ?? 0,
      ...(eventsUrl ? { eventsUrl } : {}),
    }

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
          })
        },
        onError: (error) => {
          void handleStreamError(checkIdToSubscribe, error)
        },
      },
      subscriptionOptions,
    )
  }

  async function handleStreamError(checkIdToReload: string, error: unknown) {
    const record = await recordState.reload()

    if (!record || checkId.value !== checkIdToReload) return

    recordProgress(record.progress)

    if (record.status === 'queued' || record.status === 'running') {
      eventError.value = error
    } else {
      eventError.value = null
    }
  }

  async function loadCheckRecord(nextCheckId: string | null) {
    closeSubscription()
    progress.value = null
    eventError.value = null

    if (!nextCheckId) {
      await recordState.reload()
      return
    }

    checks.setCurrentCheckId(nextCheckId)
    const record = await recordState.reload()

    if (!record || checkId.value !== nextCheckId) return

    recordProgress(record.progress)

    if (record.status === 'queued' || record.status === 'running') {
      subscribe(nextCheckId)
    }
  }

  watch(
    checkId,
    (nextCheckId) => {
      void loadCheckRecord(nextCheckId)
    },
    { immediate: true },
  )

  onScopeDispose(closeSubscription)

  const phase = computed<CheckPhase>(
    () => progress.value?.phase ?? recordState.data.value?.progress.phase ?? 'understanding',
  )
  const status = computed(
    () => progress.value?.status ?? recordState.data.value?.status ?? 'queued',
  )
  const phaseIndex = computed(() => activePhaseIndexOf(phase.value))
  const activePhaseKey = computed(() => activePhase(phase.value))
  const phaseDefinition = computed(() => PHASE_DEFINITIONS[activePhaseKey.value])
  const progressError = computed(() => eventError.value ?? recordState.error.value)

  /** MOCK DEV ONLY — Manually override the current phase for dev inspection. */
  function setPhase(nextPhase: CheckPhase) {
    const currentCheckId = checkId.value ?? checks.currentCheckId ?? 'demo-check'
    recordProgress(makeDevProgress(currentCheckId, nextPhase))
  }

  async function retry() {
    await loadCheckRecord(checkId.value)
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
  }
}
