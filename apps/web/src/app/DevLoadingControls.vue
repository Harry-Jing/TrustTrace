<script setup lang="ts">
/**
 * DEV ONLY — Phase switcher for the loading page.
 * Allows manually stepping through check phases without auto-progression.
 */
import type { CheckPhase } from '@/features/checks/types'

defineProps<{
  phases: readonly CheckPhase[]
  phase: CheckPhase
}>()

const emit = defineEmits<{
  setPhase: [phase: CheckPhase]
  done: []
}>()
</script>

<template>
  <div class="mt-4 border-t border-dashed border-line pt-3">
    <span class="mb-1.5 block font-mono text-[9px] tracking-[0.1em] text-muted uppercase">
      dev · phase control
    </span>
    <div class="flex flex-wrap gap-1">
      <button
        v-for="p in phases.slice(0, 4)"
        :key="p"
        class="tt-btn rounded px-2 py-[3px] font-mono text-[10px]"
        :class="
          phase === p
            ? 'border border-ink bg-ink text-surface'
            : 'border border-line bg-transparent text-muted'
        "
        :aria-pressed="phase === p"
        @click="emit('setPhase', p)"
      >
        {{ p }}
      </button>
      <button
        class="tt-btn rounded border border-accent bg-transparent px-2 py-[3px] font-mono text-[10px] text-accent"
        @click="emit('done')"
      >
        ✓ done
      </button>
    </div>
  </div>
</template>
