<script setup lang="ts">
/**
 * DEV ONLY — Floating dev panel.
 *
 * Bottom-right FAB ("● MOCK · <scenario>") that expands into a panel with
 * four collapsible sections:
 *   1. Scenario     — pick the active scenario (radio list, default open)
 *   2. Demo claim   — pick the active demo claim (radio list, default open)
 *   3. Jump to      — pure navigation between demo pages (default collapsed)
 *   4. Mock state   — reset / complete / fail the active mock record (default collapsed)
 *
 * Layout follows the small-OSS-devtools convention surveyed in
 * `docs/dev-tooling.md`: `width: min(380px, 100vw - 32px)`, internal scroll
 * via `max-height: min(640px, 100dvh - 96px)`, mobile-narrow viewports
 * become a bottom sheet. Section open/closed state and panel open state
 * persist via the dev store. The FAB is the only way to open the panel —
 * no keyboard shortcut, since dev tooling lives next to a form-heavy app
 * and any unmodified key risks colliding with input focus flows.
 *
 * Three behaviors that the previous panel got wrong are fixed here:
 *
 *  1. Picking a demo claim now navigates. If the user is currently on a
 *     `/checks/:checkId/(loading|result|error)` route, picking a different
 *     claim swaps the checkId in-place; otherwise only the store updates.
 *  2. Mock-state buttons (reset / complete / fail) navigate to the
 *     corresponding route after mutating the mock so the panel buttons and
 *     the loading-page buttons produce the same observable result.
 *  3. Jump-to no longer mutates state. result/error jumps used to silently
 *     force-complete or force-fail the record; they are pure navigation
 *     now. Use Mock state when you want a state change.
 */
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";

import type { DevPanelSection } from "@/dev/devConfig";
import { DEV_SCENARIOS, type DevScenarioId } from "@/dev/scenarios";
import { useDevStore } from "@/dev/stores/dev.store";
import EvidenceBadge from "@/features/checks/components/EvidenceBadge.vue";
import {
  devResetCheckProgress,
  devSetCheckCompleted,
  devSetCheckFailed,
} from "@/features/checks/api/checksApi";
import { evidenceToneFor } from "@/features/checks/constants/evidenceTone";
import { DEMO_CHECKS } from "@/features/checks/fixtures/demoChecks";

const dev = useDevStore();
const router = useRouter();
const route = useRoute();

// --- Derived state ----------------------------------------------------------

const scenarioCategory = computed<"happy" | "error">(() =>
  dev.scenario.outcome.type === "failed" ? "error" : "happy",
);

// Tone classes: the FAB wears scenario tone (success vs warning) so the
// at-a-glance dot communicates "this scenario is the failure variant"
// without needing to open the panel.
const fabToneClass = computed(() =>
  scenarioCategory.value === "error"
    ? "border-warning/50 bg-warning-muted/80 text-warning"
    : "border-success/40 bg-success-muted/70 text-success",
);

const checkIdParam = computed(() => {
  const value = route.params.checkId;
  return typeof value === "string" ? value : null;
});

// When viewing a specific check, panel actions target that check; otherwise
// they target the user-selected demo claim. This keeps DevLoadingControls'
// "fail" button affecting whatever you're looking at while the panel's
// global actions follow your demo-claim selection.
const activeCheckId = computed(() => checkIdParam.value ?? dev.demoCheckId);

// `loading | result | error` if we're on a check-scoped route, else null.
// Used to decide whether mutating the mock should trigger a route swap.
const checkRouteName = computed<"loading" | "result" | "error" | null>(() => {
  const name = route.name;
  if (name === "loading" || name === "result" || name === "error") return name;
  return null;
});

// --- Scenario picker --------------------------------------------------------

function pickScenario(id: DevScenarioId) {
  dev.setScenario(id);
}

// --- Demo claim picker (now navigates if we're on a check-scoped route) ----

function pickDemoCheck(id: string) {
  dev.setDemoCheckId(id);
  const currentRouteName = checkRouteName.value;
  if (currentRouteName === null) return;
  if (id === checkIdParam.value) return;

  // Prime the target claim's mock record to match the page we're on, so
  // /error doesn't render the default-completed record as "UNKNOWN_ERROR"
  // and /loading doesn't auto-redirect away from a previously-completed
  // demo. /result is naturally completed-by-default, so no priming.
  if (currentRouteName === "error") devSetCheckFailed(id);
  else if (currentRouteName === "loading") devResetCheckProgress(id);

  void router.replace({ name: currentRouteName, params: { checkId: id } });
}

// --- Jump to (pure navigation, no state mutation) --------------------------

function go(path: string) {
  void router.push(path);
}

function gotoLoading() {
  // Reset is needed here because /loading would otherwise auto-redirect
  // away from a completed/failed record. This is a navigation-affordance
  // concern, not a state-change concern, so it stays attached to "Jump to".
  devResetCheckProgress(activeCheckId.value);
  go(`/checks/${activeCheckId.value}/loading`);
}

function gotoResult() {
  go(`/checks/${activeCheckId.value}/result`);
}

function gotoError() {
  go(`/checks/${activeCheckId.value}/error`);
}

function gotoHistory() {
  go("/history");
}

function gotoHome() {
  go("/");
}

// --- Mock state actions (mutate + navigate to make the change observable) --

function navigateForRouteAfterStateChange(name: "loading" | "result" | "error") {
  // If we're on a `/checks/:id/*` route, replace into the matching state
  // route so the page we're on re-derives from the new mock record. If
  // we're elsewhere (history / settings / landing), do nothing — the
  // user's location stays put and the next visit will pick up the new state.
  if (checkRouteName.value === null) return;
  void router.replace({ name, params: { checkId: activeCheckId.value } });
}

function resetProgress() {
  devResetCheckProgress(activeCheckId.value);
  navigateForRouteAfterStateChange("loading");
}

function forceComplete() {
  devSetCheckCompleted(activeCheckId.value);
  navigateForRouteAfterStateChange("result");
}

function forceFail() {
  devSetCheckFailed(activeCheckId.value);
  navigateForRouteAfterStateChange("error");
}

// --- Section collapse helpers ----------------------------------------------

function isOpen(section: DevPanelSection): boolean {
  return !dev.isSectionCollapsed(section);
}
function toggle(section: DevPanelSection) {
  dev.toggleSection(section);
}
</script>

<template>
  <!-- The panel is teleported via fixed positioning at the document root so
       app-level transitions don't unmount it on route changes. -->
  <Transition name="dev-panel">
    <section
      v-if="dev.panelOpen"
      class="fixed right-2 bottom-[calc(env(safe-area-inset-bottom,0px)+0.5rem)] left-2 z-[60] flex max-h-[min(640px,calc(100dvh-6rem))] flex-col overflow-hidden rounded-2xl border border-border bg-card text-foreground shadow-card-hover sm:right-4 sm:bottom-[calc(env(safe-area-inset-bottom,0px)+1rem)] sm:left-auto sm:w-[min(22rem,calc(100vw-2rem))] sm:rounded-xl"
      role="region"
      aria-label="Dev panel"
    >
      <!-- Sticky header -->
      <header
        class="flex shrink-0 items-center justify-between gap-2 border-b border-border bg-card px-3 py-2"
      >
        <div class="flex min-w-0 items-center gap-2">
          <span
            class="size-2 shrink-0 rounded-full"
            :class="scenarioCategory === 'error' ? 'bg-warning' : 'bg-success'"
            aria-hidden="true"
          />
          <span class="font-mono text-eyebrow text-foreground-subtle uppercase">Dev panel</span>
        </div>
        <div class="flex items-center gap-2 text-foreground-subtle">
          <button
            type="button"
            class="tt-icon-btn flex size-6 items-center justify-center rounded border-none bg-transparent text-foreground-subtle hover:text-foreground"
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
        </div>
      </header>

      <!-- Scrollable content -->
      <div class="flex-1 divide-y divide-border overflow-y-auto overscroll-contain">
        <!-- Scenario -->
        <details :open="isOpen('scenario')" class="group">
          <summary
            class="flex cursor-pointer list-none items-center justify-between px-3 py-2 hover:bg-surface/60"
            @click.prevent="toggle('scenario')"
          >
            <span class="font-mono text-eyebrow text-foreground-subtle uppercase">Scenario</span>
            <span class="flex items-center gap-2">
              <span class="truncate text-body-sm text-foreground-muted">
                {{ dev.scenario.label }}
              </span>
              <svg
                class="size-3 text-foreground-subtle transition-transform"
                :class="isOpen('scenario') ? 'rotate-180' : ''"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                aria-hidden="true"
              >
                <path d="M3 4.5L6 7.5L9 4.5" />
              </svg>
            </span>
          </summary>
          <div class="px-2 pb-2" role="radiogroup" aria-label="Active scenario">
            <label
              v-for="scenario in DEV_SCENARIOS"
              :key="scenario.id"
              class="flex cursor-pointer items-start gap-2 rounded-md px-2 py-2 transition-colors duration-100 hover:bg-surface"
              :class="dev.scenarioId === scenario.id ? 'bg-accent-muted' : ''"
            >
              <input
                type="radio"
                name="dev-scenario"
                class="mt-1 size-3 accent-accent"
                :value="scenario.id"
                :checked="dev.scenarioId === scenario.id"
                @change="pickScenario(scenario.id)"
              />
              <span class="flex min-w-0 flex-col gap-0.5">
                <span class="text-body-sm text-foreground">{{ scenario.label }}</span>
                <span class="text-caption text-foreground-subtle">
                  {{ scenario.description }}
                </span>
              </span>
            </label>
          </div>
        </details>

        <!-- Demo claim -->
        <details :open="isOpen('claim')" class="group">
          <summary
            class="flex cursor-pointer list-none items-center justify-between px-3 py-2 hover:bg-surface/60"
            @click.prevent="toggle('claim')"
          >
            <span class="font-mono text-eyebrow text-foreground-subtle uppercase">Demo claim</span>
            <span class="flex items-center gap-2">
              <span class="truncate text-body-sm text-foreground-muted">
                {{ activeCheckId }}
              </span>
              <svg
                class="size-3 text-foreground-subtle transition-transform"
                :class="isOpen('claim') ? 'rotate-180' : ''"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                aria-hidden="true"
              >
                <path d="M3 4.5L6 7.5L9 4.5" />
              </svg>
            </span>
          </summary>
          <div class="px-2 pb-2" role="radiogroup" aria-label="Active demo claim">
            <label
              v-for="demo in DEMO_CHECKS"
              :key="demo.checkId"
              class="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 transition-colors duration-100 hover:bg-surface"
              :class="dev.demoCheckId === demo.checkId ? 'bg-accent-muted' : ''"
            >
              <input
                type="radio"
                name="dev-demo-claim"
                class="size-3 shrink-0 accent-accent"
                :value="demo.checkId"
                :checked="dev.demoCheckId === demo.checkId"
                @change="pickDemoCheck(demo.checkId)"
              />
              <span class="min-w-0 flex-1 truncate text-body-sm text-foreground">
                {{ demo.claim }}
              </span>
              <EvidenceBadge :tone="evidenceToneFor(demo.verdictBand)" class="shrink-0">
                {{ demo.cue }}
              </EvidenceBadge>
            </label>
          </div>
        </details>

        <!-- Jump to (pure navigation) -->
        <details :open="isOpen('jump')" class="group">
          <summary
            class="flex cursor-pointer list-none items-center justify-between px-3 py-2 hover:bg-surface/60"
            @click.prevent="toggle('jump')"
          >
            <span class="font-mono text-eyebrow text-foreground-subtle uppercase">Jump to</span>
            <svg
              class="size-3 text-foreground-subtle transition-transform"
              :class="isOpen('jump') ? 'rotate-180' : ''"
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              aria-hidden="true"
            >
              <path d="M3 4.5L6 7.5L9 4.5" />
            </svg>
          </summary>
          <div class="flex flex-wrap gap-1 px-3 pb-3">
            <button
              type="button"
              class="tt-btn rounded border border-border bg-transparent px-2 py-1 font-mono text-caption text-foreground-muted"
              @click="gotoHome"
            >
              home
            </button>
            <button
              type="button"
              class="tt-btn rounded border border-border bg-transparent px-2 py-1 font-mono text-caption text-foreground-muted"
              @click="gotoLoading"
            >
              loading
            </button>
            <button
              type="button"
              class="tt-btn rounded border border-border bg-transparent px-2 py-1 font-mono text-caption text-foreground-muted"
              @click="gotoResult"
            >
              result
            </button>
            <button
              type="button"
              class="tt-btn rounded border border-border bg-transparent px-2 py-1 font-mono text-caption text-foreground-muted"
              @click="gotoError"
            >
              error
            </button>
            <button
              type="button"
              class="tt-btn rounded border border-border bg-transparent px-2 py-1 font-mono text-caption text-foreground-muted"
              @click="gotoHistory"
            >
              history
            </button>
          </div>
        </details>

        <!-- Mock state -->
        <details :open="isOpen('state')" class="group">
          <summary
            class="flex cursor-pointer list-none items-center justify-between px-3 py-2 hover:bg-surface/60"
            @click.prevent="toggle('state')"
          >
            <span class="font-mono text-eyebrow text-foreground-subtle uppercase">Mock state</span>
            <svg
              class="size-3 text-foreground-subtle transition-transform"
              :class="isOpen('state') ? 'rotate-180' : ''"
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              aria-hidden="true"
            >
              <path d="M3 4.5L6 7.5L9 4.5" />
            </svg>
          </summary>
          <div class="flex flex-wrap gap-1 px-3 pb-3">
            <button
              type="button"
              class="tt-btn rounded border border-border bg-transparent px-2 py-1 font-mono text-caption text-foreground-muted"
              :title="`Reset ${activeCheckId} to its initial phase`"
              @click="resetProgress"
            >
              ↻ reset
            </button>
            <button
              type="button"
              class="tt-btn rounded border border-success bg-transparent px-2 py-1 font-mono text-caption text-success"
              :title="`Force ${activeCheckId} to completed`"
              @click="forceComplete"
            >
              ✓ complete
            </button>
            <button
              type="button"
              class="tt-btn rounded border border-warning bg-transparent px-2 py-1 font-mono text-caption text-warning"
              :title="`Apply the active scenario's failure to ${activeCheckId}`"
              @click="forceFail"
            >
              ✕ fail
            </button>
          </div>
        </details>
      </div>

      <!-- Sticky footer with the active check id -->
      <footer
        class="flex shrink-0 items-center justify-between gap-2 border-t border-border bg-surface/60 px-3 py-2 font-mono text-caption text-foreground-subtle"
      >
        <span class="truncate" :title="activeCheckId">{{ activeCheckId }}</span>
        <span class="shrink-0">{{ dev.scenarioId }}</span>
      </footer>
    </section>
  </Transition>

  <!-- Always-visible FAB / toggle. Width is fixed so a long scenario label
       inside the panel doesn't reflow the corner button. -->
  <button
    type="button"
    class="fixed right-3 bottom-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] z-[60] inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-caption shadow-sm backdrop-blur-sm transition-transform duration-150 hover:-translate-y-px hover:shadow-md sm:right-4 sm:bottom-[calc(env(safe-area-inset-bottom,0px)+1rem)]"
    :class="fabToneClass"
    :aria-expanded="dev.panelOpen"
    aria-controls="dev-panel"
    aria-label="Toggle dev panel"
    :title="dev.panelOpen ? 'Close dev panel' : 'Open dev panel'"
    @click="dev.togglePanel()"
  >
    <span class="flex size-1.5 animate-pulse-dot rounded-full bg-current" aria-hidden="true" />
    <span class="font-semibold tracking-[0.12em] uppercase">Mock</span>
    <span class="hidden text-foreground-subtle/80 sm:inline" aria-hidden="true">·</span>
    <span class="hidden max-w-[7rem] truncate sm:inline">{{ dev.scenario.label }}</span>
  </button>
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
  transform: scale(0.97) translateY(8px);
}

/* Hide the default disclosure marker on every browser, since the panel
   ships its own chevron icon. */
details > summary {
  list-style: none;
}
details > summary::-webkit-details-marker {
  display: none;
}
</style>
