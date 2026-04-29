<script setup lang="ts">
/**
 * DEV ONLY — Phase + outcome controls for the loading page.
 *
 * Sits inline at the bottom of the loading page so that scenario inspection
 * happens next to the thing being inspected. Phase buttons read percent +
 * message from the active scenario so manual jumps and the auto-played
 * stream agree on what each phase looks like.
 */
import { computed } from "vue";

import { buildPhaseLookup } from "@/dev/scenarios";
import { useDevStore } from "@/dev/stores/dev.store";
import { PHASE_DEFINITIONS } from "@/features/checks/constants/checkProgress";
import type { ActiveCheckPhase, CheckPhase } from "@/features/checks/types";

defineProps<{
  phases: readonly ActiveCheckPhase[];
  phase: CheckPhase;
}>();

const emit = defineEmits<{
  setPhase: [phase: CheckPhase];
  fail: [];
  complete: [];
  replay: [];
}>();

const dev = useDevStore();

const phaseLookup = computed(() => buildPhaseLookup(dev.scenario));
const outcomeLabel = computed(() =>
  dev.scenario.outcome.type === "completed"
    ? "completes"
    : `fails · ${dev.scenario.outcome.error.code}`,
);
</script>

<template>
  <div class="mt-8 border-t border-dashed border-border pt-3">
    <div class="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
      <span class="font-mono text-micro tracking-[0.12em] text-foreground-subtle uppercase">
        dev · phase control
      </span>
      <span
        class="rounded-full border border-border bg-surface/60 px-2 py-0.5 font-mono text-micro text-foreground-muted"
        :title="dev.scenario.description"
      >
        {{ dev.scenario.id }} · {{ outcomeLabel }}
      </span>
    </div>

    <div class="flex flex-wrap items-center gap-1.5">
      <button
        v-for="phaseOption in phases"
        :key="phaseOption"
        type="button"
        class="tt-btn rounded px-2 py-0.75 font-mono text-[10px]"
        :class="
          phase === phaseOption
            ? 'border border-foreground bg-foreground text-background'
            : 'border border-border bg-transparent text-foreground-subtle'
        "
        :aria-pressed="phase === phaseOption"
        :title="`${PHASE_DEFINITIONS[phaseOption].title} (${String(phaseLookup[phaseOption].percent)}%)`"
        @click="emit('setPhase', phaseOption)"
      >
        {{ PHASE_DEFINITIONS[phaseOption].shortLabel }}
      </button>

      <span class="mx-1 h-4 w-px bg-border" aria-hidden="true" />

      <button
        type="button"
        class="tt-btn rounded border border-border bg-transparent px-2 py-0.75 font-mono text-[10px] text-foreground-subtle"
        title="Re-run the active scenario from the start"
        @click="emit('replay')"
      >
        ↻ replay
      </button>
      <button
        type="button"
        class="tt-btn inline-flex items-center gap-1 rounded border border-success bg-transparent px-2 py-0.75 font-mono text-[10px] text-success"
        title="Jump to completed and trigger the redirect"
        @click="emit('complete')"
      >
        ✓ complete
      </button>
      <button
        type="button"
        class="tt-btn rounded border border-warning bg-transparent px-2 py-0.75 font-mono text-[10px] text-warning"
        title="Force a failure with the active scenario's error"
        @click="emit('fail')"
      >
        ✕ fail
      </button>
    </div>
  </div>
</template>
