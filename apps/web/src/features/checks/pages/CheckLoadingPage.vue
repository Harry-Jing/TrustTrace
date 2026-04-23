<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import PageFooter from '@/components/PageFooter.vue'
import DevLoadingControls from '@/app/DevLoadingControls.vue'
import { showDevTools } from '@/app/env'
import TagBadge from '@/components/TagBadge.vue'
import EvidenceStream from '@/features/checks/components/EvidenceStream.vue'
import ProgressTimeline from '@/features/checks/components/ProgressTimeline.vue'
import { useCheckProgress } from '@/features/checks/composables/useCheckProgress'
import type { CheckPhase } from '@/features/checks/types'

const showCelebration = ref(false)
const router = useRouter()
const {
  checkId,
  phases,
  status,
  phase,
  phaseIndex,
  tip,
  evidenceItems,
  progressError,
  retry,
  setPhase,
} = useCheckProgress()
let redirectTimer: ReturnType<typeof setTimeout> | null = null

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

function segmentFillClass(index: number) {
  if (index < phaseIndex.value) return 'scale-x-100'
  if (index === phaseIndex.value) return 'scale-x-[0.6]'
  return 'scale-x-0'
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
  <div class="mx-auto max-w-[1080px] px-6 pt-12 pb-20">
    <!-- Celebration state -->
    <div v-if="showCelebration" class="anim-up py-30 text-center">
      <div
        class="mx-auto mb-5 flex size-16 anim-celeb-glow anim-celeb-pop items-center justify-center rounded-full bg-accent text-[28px] text-white"
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
      <!-- Header -->
      <div class="mb-2 flex items-center gap-3" aria-live="polite">
        <TagBadge tone="accent">{{ phase }}</TagBadge>
        <span class="font-mono text-xs tracking-[0.03em] text-muted">check in progress</span>
      </div>
      <h1 class="mb-1.5 font-serif text-[32px] tracking-tight">Pulling evidence for your claim</h1>
      <p class="mb-7 max-w-[560px] text-sm leading-[1.7] text-muted">
        Evidence appears as it arrives. Nothing is final until the reasoning completes.
      </p>

      <!-- Segmented progress -->
      <div class="loading-segmented mb-7 flex gap-[3px]" aria-hidden="true">
        <div
          v-for="(p, i) in phases"
          :key="p"
          class="relative h-1.5 flex-1 overflow-hidden rounded-[3px] bg-line"
        >
          <div
            class="h-full w-full origin-left rounded-[3px] bg-accent transition-transform duration-600 ease-out"
            :class="[segmentFillClass(i), i === phaseIndex ? 'anim-shimmer' : '']"
          />
          <div
            class="absolute top-3 w-full text-center font-mono text-[10px] tracking-[0.04em]"
            :class="i <= phaseIndex ? 'font-semibold text-ink' : 'text-muted'"
          >
            {{ p }}
          </div>
        </div>
      </div>

      <!-- Two-column layout -->
      <div class="loading-main mt-9 grid grid-cols-1 items-start gap-10 md:grid-cols-[240px_1fr]">
        <ProgressTimeline :phases="phases" :phase-index="phaseIndex" :tip="tip">
          <DevLoadingControls
            v-if="showDevTools"
            :phases="phases"
            :phase="phase"
            @set-phase="handleSetPhase"
            @done="handleDone"
          />
        </ProgressTimeline>

        <!-- Right pane: evidence stream -->
        <EvidenceStream
          :items="evidenceItems"
          :waiting="status !== 'completed' && status !== 'failed'"
        />
      </div>

      <PageFooter>TrustTrace &middot; evidence-first credibility</PageFooter>
    </template>
  </div>
</template>
