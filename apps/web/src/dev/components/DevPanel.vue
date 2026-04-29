<script setup lang="ts">
/**
 * DEV ONLY — Floating dev panel.
 *
 * Bottom-right pill ("MOCK · <scenario>") that expands into a small panel
 * with four concerns:
 *   1. Pick the active scenario (radio list)
 *   2. Pick the active demo claim (radio list — drives which result fixture
 *      / verdict band the page renders)
 *   3. Jump between the demo pages (loading / result / error)
 *   4. Quick mock-state actions (reset / fail / complete)
 *
 * Modeled on Pinia Colada Devtools — small floating affordance, in-panel
 * verb buttons, no command palette. The Shift+Alt+D hotkey toggles the
 * panel; otherwise the badge is always visible so dev mode is never silent.
 */
import { computed, onBeforeUnmount, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";

import { DEV_SCENARIOS, type DevScenarioId } from "@/dev/scenarios";
import { useDevStore } from "@/dev/stores/dev.store";
import {
  devResetCheckProgress,
  devSetCheckCompleted,
  devSetCheckFailed,
} from "@/features/checks/api/checksApi";
import { DEMO_CHECKS } from "@/features/checks/fixtures/demoChecks";

const dev = useDevStore();
const router = useRouter();
const route = useRoute();

function isPanelHotkey(event: KeyboardEvent): boolean {
  return event.shiftKey && event.altKey && (event.key === "D" || event.key === "d");
}

function onKeyDown(event: KeyboardEvent) {
  if (!isPanelHotkey(event)) return;
  event.preventDefault();
  dev.togglePanel();
}

onMounted(() => {
  window.addEventListener("keydown", onKeyDown);
});
onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKeyDown);
});

const scenarioCategory = computed(() => {
  if (dev.scenario.outcome.type === "failed") return "error";
  return "happy";
});

const badgeToneClass = computed(() =>
  scenarioCategory.value === "error"
    ? "border-warning/60 text-warning bg-warning-muted"
    : "border-success/40 text-success bg-success-muted/60",
);

function pickScenario(id: DevScenarioId) {
  dev.setScenario(id);
}

const checkIdParam = computed(() => {
  const value = route.params.checkId;
  return typeof value === "string" ? value : null;
});

// When viewing a specific check, panel actions target that check; otherwise
// they target the user-selected demo claim. This keeps DevLoadingControls'
// "fail" button affecting whatever you're looking at while the panel's
// global actions follow your demo-claim selection.
const activeCheckId = computed(() => checkIdParam.value ?? dev.demoCheckId);

function pickDemoCheck(id: string) {
  dev.setDemoCheckId(id);
}

function go(path: string) {
  void router.push(path);
}

function gotoLoading() {
  devResetCheckProgress(activeCheckId.value);
  go(`/checks/${activeCheckId.value}/loading`);
}

function gotoResult() {
  // Normalize the mock record to completed before navigating. Without this,
  // if the record was previously left in `failed` (e.g. after pressing the
  // "error" button) or `running` state, useCheckResult auto-redirects away
  // from /result, making it look like Result is broken.
  devSetCheckCompleted(activeCheckId.value);
  go(`/checks/${activeCheckId.value}/result`);
}

function gotoError() {
  devSetCheckFailed(activeCheckId.value);
  go(`/checks/${activeCheckId.value}/error`);
}

function gotoHistory() {
  go("/history");
}

function gotoHome() {
  go("/");
}

function resetProgress() {
  devResetCheckProgress(activeCheckId.value);
}

function forceComplete() {
  devSetCheckCompleted(activeCheckId.value);
}

function forceFail() {
  devSetCheckFailed(activeCheckId.value);
}
</script>

<template>
  <div class="fixed right-4 bottom-4 z-50 flex flex-col items-end gap-2">
    <!-- Expanded panel -->
    <Transition name="dev-panel">
      <section
        v-if="dev.panelOpen"
        class="w-72 overflow-hidden rounded-xl border border-border bg-card text-foreground shadow-card-hover"
        role="region"
        aria-label="Dev panel"
      >
        <header
          class="flex items-center justify-between border-b border-border px-3 py-2 font-mono text-micro tracking-[0.12em] text-foreground-subtle uppercase"
        >
          <span>Dev panel</span>
          <button
            type="button"
            class="flex size-5 items-center justify-center rounded border-none bg-transparent text-foreground-subtle hover:text-foreground"
            aria-label="Close dev panel"
            @click="dev.closePanel()"
          >
            <svg
              class="size-3"
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              aria-hidden="true"
            >
              <path d="M3 3l6 6M9 3l-6 6" />
            </svg>
          </button>
        </header>

        <div class="px-3 pt-3 pb-2">
          <div class="mb-1.5 font-mono text-eyebrow text-foreground-subtle uppercase">Scenario</div>
          <div class="flex flex-col gap-0.5" role="radiogroup" aria-label="Active scenario">
            <label
              v-for="scenario in DEV_SCENARIOS"
              :key="scenario.id"
              class="flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 transition-colors duration-100 hover:bg-surface"
              :class="dev.scenarioId === scenario.id ? 'bg-accent-muted' : ''"
            >
              <input
                type="radio"
                name="dev-scenario"
                class="mt-0.5 size-3 accent-accent"
                :value="scenario.id"
                :checked="dev.scenarioId === scenario.id"
                @change="pickScenario(scenario.id)"
              />
              <span class="flex min-w-0 flex-col">
                <span class="text-body-sm leading-tight">{{ scenario.label }}</span>
                <span class="font-mono text-micro text-foreground-subtle">
                  {{ scenario.description }}
                </span>
              </span>
            </label>
          </div>
        </div>

        <div class="border-t border-border px-3 pt-3 pb-2">
          <div class="mb-1.5 font-mono text-eyebrow text-foreground-subtle uppercase">
            Demo claim
          </div>
          <div class="flex flex-col gap-0.5" role="radiogroup" aria-label="Active demo claim">
            <label
              v-for="demo in DEMO_CHECKS"
              :key="demo.checkId"
              class="flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 transition-colors duration-100 hover:bg-surface"
              :class="dev.demoCheckId === demo.checkId ? 'bg-accent-muted' : ''"
            >
              <input
                type="radio"
                name="dev-demo-claim"
                class="mt-0.5 size-3 accent-accent"
                :value="demo.checkId"
                :checked="dev.demoCheckId === demo.checkId"
                @change="pickDemoCheck(demo.checkId)"
              />
              <span class="flex min-w-0 flex-col">
                <span class="truncate text-body-sm leading-tight">{{ demo.claim }}</span>
                <span class="font-mono text-micro text-foreground-subtle">{{ demo.cue }}</span>
              </span>
            </label>
          </div>
        </div>

        <div class="border-t border-border px-3 pt-3 pb-2">
          <div class="mb-1.5 font-mono text-eyebrow text-foreground-subtle uppercase">Jump to</div>
          <div class="flex flex-wrap gap-1">
            <button
              type="button"
              class="tt-btn rounded border border-border bg-transparent px-2 py-1 font-mono text-[10px] text-foreground-muted"
              @click="gotoHome"
            >
              home
            </button>
            <button
              type="button"
              class="tt-btn rounded border border-border bg-transparent px-2 py-1 font-mono text-[10px] text-foreground-muted"
              @click="gotoLoading"
            >
              loading
            </button>
            <button
              type="button"
              class="tt-btn rounded border border-border bg-transparent px-2 py-1 font-mono text-[10px] text-foreground-muted"
              @click="gotoResult"
            >
              result
            </button>
            <button
              type="button"
              class="tt-btn rounded border border-border bg-transparent px-2 py-1 font-mono text-[10px] text-foreground-muted"
              @click="gotoError"
            >
              error
            </button>
            <button
              type="button"
              class="tt-btn rounded border border-border bg-transparent px-2 py-1 font-mono text-[10px] text-foreground-muted"
              @click="gotoHistory"
            >
              history
            </button>
          </div>
        </div>

        <div class="border-t border-border px-3 pt-3 pb-3">
          <div class="mb-1.5 font-mono text-eyebrow text-foreground-subtle uppercase">
            Mock state
          </div>
          <div class="flex flex-wrap gap-1">
            <button
              type="button"
              class="tt-btn rounded border border-border bg-transparent px-2 py-1 font-mono text-[10px] text-foreground-muted"
              :title="`Reset ${activeCheckId} to its initial phase`"
              @click="resetProgress"
            >
              ↻ reset
            </button>
            <button
              type="button"
              class="tt-btn rounded border border-success bg-transparent px-2 py-1 font-mono text-[10px] text-success"
              :title="`Force ${activeCheckId} to completed`"
              @click="forceComplete"
            >
              ✓ complete
            </button>
            <button
              type="button"
              class="tt-btn rounded border border-warning bg-transparent px-2 py-1 font-mono text-[10px] text-warning"
              :title="`Apply the active scenario's failure to ${activeCheckId}`"
              @click="forceFail"
            >
              ✕ fail
            </button>
          </div>
        </div>

        <footer
          class="flex items-center justify-between gap-2 border-t border-border bg-surface/60 px-3 py-2 font-mono text-micro text-foreground-subtle"
        >
          <span>{{ activeCheckId }}</span>
          <span class="flex items-center gap-1">
            <kbd class="rounded border border-border px-1 py-px">⇧</kbd>
            <kbd class="rounded border border-border px-1 py-px">⌥</kbd>
            <kbd class="rounded border border-border px-1 py-px">D</kbd>
          </span>
        </footer>
      </section>
    </Transition>

    <!-- Always-visible badge / toggle -->
    <button
      type="button"
      class="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-micro tracking-narrow shadow-sm backdrop-blur-sm transition-transform duration-150 hover:-translate-y-px hover:shadow-md"
      :class="badgeToneClass"
      :aria-expanded="dev.panelOpen"
      aria-label="Toggle dev panel"
      :title="dev.panelOpen ? 'Close dev panel (⇧⌥D)' : 'Open dev panel (⇧⌥D)'"
      @click="dev.togglePanel()"
    >
      <span class="flex size-1.5 animate-pulse-dot rounded-full bg-current" aria-hidden="true" />
      <span class="font-semibold tracking-[0.08em] uppercase">MOCK</span>
      <span class="text-foreground-subtle/80" aria-hidden="true">·</span>
      <span class="truncate">{{ dev.scenario.label }}</span>
    </button>
  </div>
</template>

<style scoped>
.dev-panel-enter-active,
.dev-panel-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s var(--ease-snappy);
  transform-origin: bottom right;
}
.dev-panel-enter-from,
.dev-panel-leave-to {
  opacity: 0;
  transform: scale(0.96) translateY(8px);
}
</style>
