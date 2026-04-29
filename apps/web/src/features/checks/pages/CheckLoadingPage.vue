<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useRouter } from "vue-router";

import BaseButton from "@/components/BaseButton.vue";
import BasePageFooter from "@/components/BasePageFooter.vue";
import BaseWarnRingIllustration from "@/components/BaseWarnRingIllustration.vue";
import DevLoadingControls from "@/dev/components/DevLoadingControls.vue";
import {
  devResetCheckProgress,
  devSetCheckCompleted,
  devSetCheckFailed,
} from "@/features/checks/api/checksApi";
import { showDevTools } from "@/app/env";
import ProgressStepper from "@/features/checks/components/ProgressStepper.vue";
import { ACTIVE_PHASES, PHASE_DEFINITIONS } from "@/features/checks/constants/checkProgress";
import { useCheckProgress } from "@/features/checks/composables/useCheckProgress";
import { DEMO_CHECKS } from "@/features/checks/fixtures/demoChecks";
import { useChecksStore } from "@/features/checks/stores/checks.store";
import type { CheckPhase } from "@/features/checks/types";

const showCelebration = ref(false);
const router = useRouter();
const checks = useChecksStore();
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
} = useCheckProgress();
let redirectTimer: ReturnType<typeof setTimeout> | null = null;

const stepperSteps = computed(() => ACTIVE_PHASES.map((key) => PHASE_DEFINITIONS[key]));

const claimText = computed(() => {
  const persisted = record.value?.input?.value;
  if (persisted) return persisted;
  const submitted = checks.currentInput?.value;
  if (submitted) return submitted;
  const demoMatch = DEMO_CHECKS.find((entry) => entry.checkId === checkId.value);
  return demoMatch?.claim ?? "";
});

function clearRedirectTimer() {
  if (!redirectTimer) return;
  clearTimeout(redirectTimer);
  redirectTimer = null;
}

function scheduleResultRedirect(nextCheckId: string) {
  clearRedirectTimer();
  redirectTimer = setTimeout(() => {
    void router.push({ name: "result", params: { checkId: nextCheckId } });
  }, 650);
}

// --- DEV: scenario + phase control ---
function handleSetPhase(nextPhase: CheckPhase) {
  setPhase(nextPhase);
  showCelebration.value = false;
}

function handleComplete() {
  const currentCheckId = checkId.value;
  if (!currentCheckId) return;
  devSetCheckCompleted(currentCheckId);
  setPhase("completed");
  showCelebration.value = true;
  scheduleResultRedirect(currentCheckId);
}

function handleFail() {
  const currentCheckId = checkId.value;
  if (!currentCheckId) return;
  devSetCheckFailed(currentCheckId);
  setPhase("failed");
  showCelebration.value = false;
  // The error page is the natural destination; jump there now since the
  // dev-mode auto-redirect is intentionally suppressed.
  void router.push({ name: "error", params: { checkId: currentCheckId } });
}

function handleReplay() {
  const currentCheckId = checkId.value;
  if (!currentCheckId) return;
  devResetCheckProgress(currentCheckId);
  showCelebration.value = false;
  // Re-running through the composable's reload path picks up the freshly
  // reset record and re-subscribes to the scenario stream.
  void retry();
}
// --- end DEV ---

function retryProgress() {
  void retry();
}

watch(
  status,
  (nextStatus) => {
    // MOCK DEV: auto-redirect is disabled only when demo controls are shown
    // so each loading phase can be inspected manually.
    if (showDevTools) return;

    const currentCheckId = checkId.value;
    if (!currentCheckId) return;

    if (nextStatus === "completed") {
      showCelebration.value = true;
      scheduleResultRedirect(currentCheckId);
    } else if (nextStatus === "failed") {
      clearRedirectTimer();
      void router.push({ name: "error", params: { checkId: currentCheckId } });
    }
  },
  { immediate: true },
);

onBeforeUnmount(clearRedirectTimer);
</script>

<template>
  <div class="mx-auto max-w-focus px-6 pt-12 pb-20">
    <!-- Celebration state -->
    <div v-if="showCelebration" class="animate-up py-30 text-center">
      <div
        class="mx-auto mb-5 flex size-16 animate-celeb-glow animate-celeb-pop items-center justify-center rounded-full bg-success text-card"
      >
        <svg
          class="size-7"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.4"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M5 12.5l4.5 4.5L19 7" />
        </svg>
      </div>
      <div class="mb-2 font-serif text-display-sm">Check complete</div>
      <span class="animate-in-delayed font-mono text-xs tracking-narrow text-foreground-subtle"
        >redirecting to results…</span
      >
    </div>

    <!-- Progress error state. Visual DNA mirrors CheckErrorPage (SVG warn ring,
         warn-tone badge, h1, retry button) so the two error surfaces feel
         like the same product family. Smaller scale (56 vs 72) since this is
         an inline transient error, not a terminal error page. -->
    <div v-else-if="progressError" class="animate-up py-24 text-center" role="alert">
      <BaseWarnRingIllustration :size="56" />
      <h1 class="mb-2.5 font-serif text-display-sm">Could not load progress</h1>
      <p class="mx-auto mb-6 max-w-105 text-sm leading-[1.75] text-foreground-subtle">
        The check was created, but the live progress stream could not be loaded. You can retry the
        connection without starting over.
      </p>
      <BaseButton variant="primary" size="lg" @click="retryProgress">Retry progress</BaseButton>
    </div>

    <!-- Loading state -->
    <template v-else>
      <!-- Header: claim being checked -->
      <div class="mb-2 font-mono text-label tracking-[0.12em] text-foreground-subtle uppercase">
        checking claim
      </div>
      <h1
        class="mb-10 font-serif text-[clamp(26px,4vw,38px)] leading-[1.2] tracking-tight"
        aria-live="polite"
      >
        <span v-if="claimText">&ldquo;{{ claimText }}&rdquo;</span>
        <span v-else class="text-foreground-subtle italic">Preparing the claim…</span>
      </h1>

      <!-- 6-step stepper -->
      <ProgressStepper :steps="stepperSteps" :current-index="phaseIndex" class="mb-8 sm:mb-12" />

      <!-- Phase header: now label + title + plain-English description.
           Crossfades on phase change so text swaps feel intentional. -->
      <section class="mb-6 min-h-40" aria-live="polite">
        <Transition name="phase-header" mode="out-in">
          <div :key="phaseDefinition.key">
            <div
              class="mb-2 flex items-center gap-2 font-mono text-label tracking-widest text-accent uppercase"
            >
              <span class="size-1.5 animate-pulse-dot rounded-full bg-accent" aria-hidden="true" />
              <span>now &middot; {{ phaseDefinition.nowLabel }}</span>
            </div>
            <h2 class="mb-2 font-serif text-[clamp(24px,3.4vw,32px)] tracking-tight">
              {{ phaseDefinition.title }}
            </h2>
            <p class="max-w-160 text-sm leading-[1.7] text-foreground-muted">
              {{ phaseDefinition.description }}
            </p>
          </div>
        </Transition>
      </section>

      <!-- Calm trust line (no live status box, no backend message echoed back) -->
      <p class="mt-6 max-w-160 text-xs leading-[1.6] text-foreground-subtle">
        Sources are verified for safety and substance before they become evidence.
      </p>

      <!-- DEV: phase + outcome controls -->
      <DevLoadingControls
        v-if="showDevTools"
        :phases="ACTIVE_PHASES"
        :phase="phase"
        @set-phase="handleSetPhase"
        @complete="handleComplete"
        @fail="handleFail"
        @replay="handleReplay"
      />

      <BasePageFooter>TrustTrace &middot; evidence-first credibility</BasePageFooter>
    </template>
  </div>
</template>
