<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import BasePageFooter from '@/components/BasePageFooter.vue'
import DevLoadingControls from '@/app/DevLoadingControls.vue'
import { showDevTools } from '@/app/env'
import ProgressStepper from '@/features/checks/components/ProgressStepper.vue'
import { ACTIVE_PHASES, PHASE_DEFINITIONS } from '@/features/checks/constants/checkProgress'
import { useCheckProgress } from '@/features/checks/composables/useCheckProgress'
import { DEMO_CHECKS } from '@/features/checks/fixtures/demoChecks'
import { useChecksStore } from '@/features/checks/stores/checks.store'
import type { CheckPhase } from '@/features/checks/types'

const showCelebration = ref(false)
const router = useRouter()
const checks = useChecksStore()
const {
  checkId,
  status,
  phase,
  phaseIndex,
  phaseDefinition,
  record,
  progressError,
  retry,
  setPhase,
} = useCheckProgress()
let redirectTimer: ReturnType<typeof setTimeout> | null = null

const stepperSteps = computed(() => ACTIVE_PHASES.map((key) => PHASE_DEFINITIONS[key]))

const claimText = computed(() => {
  const persisted = record.value?.input?.value
  if (persisted) return persisted
  const submitted = checks.currentInput?.value
  if (submitted) return submitted
  const demoMatch = DEMO_CHECKS.find((entry) => entry.checkId === checkId.value)
  return demoMatch?.claim ?? ''
})

function clearRedirectTimer() {
  if (!redirectTimer) return
  clearTimeout(redirectTimer)
  redirectTimer = null
}

function scheduleResultRedirect(nextCheckId: string) {
  clearRedirectTimer()
  redirectTimer = setTimeout(() => {
    void router.push({ name: 'result', params: { checkId: nextCheckId } })
  }, 650)
}

// --- DEV: manual phase control ---
function handleSetPhase(nextPhase: CheckPhase) {
  setPhase(nextPhase)
  showCelebration.value = false
}

function handleDone() {
  setPhase('completed')
  // DEV: explicitly trigger the completion redirect that is otherwise
  // suppressed in dev mode (see the watch below).
  const currentCheckId = checkId.value
  if (showDevTools && currentCheckId) {
    showCelebration.value = true
    scheduleResultRedirect(currentCheckId)
  }
}
// --- end DEV ---

function retryProgress() {
  void retry()
}

watch(
  status,
  (nextStatus) => {
    // MOCK DEV: auto-redirect is disabled only when demo controls are shown
    // so each loading phase can be inspected manually.
    if (showDevTools) return

    const currentCheckId = checkId.value
    if (!currentCheckId) return

    if (nextStatus === 'completed') {
      showCelebration.value = true
      scheduleResultRedirect(currentCheckId)
    } else if (nextStatus === 'failed') {
      clearRedirectTimer()
      void router.push({ name: 'error', params: { checkId: currentCheckId } })
    }
  },
  { immediate: true },
)

onBeforeUnmount(clearRedirectTimer)
</script>

<template>
  <div class="mx-auto max-w-[920px] px-6 pt-12 pb-20">
    <!-- Celebration state -->
    <div v-if="showCelebration" class="anim-up py-30 text-center">
      <div
        class="mx-auto mb-5 flex size-16 anim-celeb-glow anim-celeb-pop items-center justify-center rounded-full bg-good text-[28px] text-card"
      >
        &#10003;
      </div>
      <div class="mb-2 font-serif text-[28px]">Check complete</div>
      <span class="anim-in-delayed font-mono text-xs tracking-[0.03em] text-muted"
        >redirecting to results…</span
      >
    </div>

    <!-- Progress error state -->
    <div v-else-if="progressError" class="anim-up py-24 text-center" role="alert">
      <div
        class="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-warn/10 text-[26px] text-warn"
      >
        !
      </div>
      <h1 class="mb-2 font-serif text-[28px] tracking-tight">Could not load progress</h1>
      <p class="mx-auto mb-6 max-w-[420px] text-sm leading-[1.75] text-muted">
        The check was created, but the live progress stream could not be loaded. You can retry the
        connection without starting over.
      </p>
      <button
        class="tt-btn rounded-md border border-line bg-card px-5 py-2 text-sm font-semibold text-ink"
        @click="retryProgress"
      >
        Retry progress
      </button>
    </div>

    <!-- Loading state -->
    <template v-else>
      <!-- Header: claim being checked -->
      <div class="mb-2 font-mono text-[11px] tracking-[0.12em] text-muted uppercase">
        checking claim
      </div>
      <h1
        class="mb-10 font-serif text-[clamp(26px,4vw,38px)] leading-[1.2] tracking-tight"
        aria-live="polite"
      >
        <span v-if="claimText">&ldquo;{{ claimText }}&rdquo;</span>
        <span v-else class="text-muted italic">Preparing the claim…</span>
      </h1>

      <!-- 6-step stepper -->
      <ProgressStepper
        :steps="stepperSteps"
        :current-index="phaseIndex"
        class="mb-8 sm:mb-12"
      />

      <!-- Phase header: now label + title + plain-English description.
           Crossfades on phase change so text swaps feel intentional. -->
      <section class="mb-6 min-h-[160px]" aria-live="polite">
        <Transition name="phase-header" mode="out-in">
          <div :key="phaseDefinition.key">
            <div
              class="mb-2 flex items-center gap-2 font-mono text-[11px] tracking-[0.1em] text-warn uppercase"
            >
              <span class="size-1.5 anim-pulse-dot rounded-full bg-warn" aria-hidden="true" />
              <span>now &middot; {{ phaseDefinition.nowLabel }}</span>
            </div>
            <h2 class="mb-2 font-serif text-[clamp(24px,3.4vw,32px)] tracking-tight">
              {{ phaseDefinition.title }}
            </h2>
            <p class="max-w-[640px] text-[14px] leading-[1.7] text-ink-2">
              {{ phaseDefinition.description }}
            </p>
          </div>
        </Transition>
      </section>

      <!-- Calm trust line (no live status box, no backend message echoed back) -->
      <p class="mt-6 max-w-[640px] text-[12px] leading-[1.6] text-muted">
        Sources are verified for safety and substance before they become evidence.
      </p>

      <!-- DEV: phase controls -->
      <DevLoadingControls
        v-if="showDevTools"
        :phases="ACTIVE_PHASES"
        :phase="phase"
        @set-phase="handleSetPhase"
        @done="handleDone"
      />

      <BasePageFooter>TrustTrace &middot; evidence-first credibility</BasePageFooter>
    </template>
  </div>
</template>
