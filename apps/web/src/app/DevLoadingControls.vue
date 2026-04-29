<script setup lang="ts">
/**
 * DEV ONLY — Phase switcher for the loading page.
 * Allows manually stepping through check phases without auto-progression.
 */
import type { ActiveCheckPhase, CheckPhase } from "@/features/checks/types";
import { PHASE_DEFINITIONS } from "@/features/checks/constants/checkProgress";

defineProps<{
  phases: readonly ActiveCheckPhase[];
  phase: CheckPhase;
}>();

const emit = defineEmits<{
  setPhase: [phase: CheckPhase];
  done: [];
}>();
</script>

<template>
  <div class="mt-8 border-t border-dashed border-border pt-3">
    <span
      class="mb-2 block font-mono text-micro tracking-[0.12em] text-foreground-subtle uppercase"
    >
      dev · phase control
    </span>
    <div class="flex flex-wrap gap-1.5">
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
        @click="emit('setPhase', phaseOption)"
      >
        {{ PHASE_DEFINITIONS[phaseOption].shortLabel }}
      </button>
      <button
        type="button"
        class="tt-btn inline-flex items-center gap-1 rounded border border-success bg-transparent px-2 py-0.75 font-mono text-[10px] text-success"
        @click="emit('done')"
      >
        <svg
          class="size-2.5"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          stroke-width="2.4"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M3.5 8.5l3 3 6-6.5" />
        </svg>
        done
      </button>
    </div>
  </div>
</template>
