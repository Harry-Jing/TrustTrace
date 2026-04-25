<script setup lang="ts">
import type { CheckListSort } from '@/features/checks/types'

defineProps<{
  search: string
  sortBy: CheckListSort
}>()

const emit = defineEmits<{
  'update:search': [value: string]
  'update:sortBy': [value: CheckListSort]
}>()
</script>

<template>
  <div class="flex stagger-2 flex-wrap items-center gap-2.5">
    <div
      class="flex min-w-[200px] flex-1 items-center gap-2 rounded-lg border border-line bg-card px-3.5 py-2 transition-[border-color] duration-200 focus-within:border-accent"
    >
      <svg
        class="size-4 shrink-0 text-muted"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.3-4.3" />
      </svg>
      <label class="sr-only" for="history-search">Search checks…</label>
      <input
        id="history-search"
        :value="search"
        placeholder="Search checks…"
        class="text-body-sm flex-1 border-none bg-transparent text-ink outline-none"
        @input="emit('update:search', ($event.target as HTMLInputElement).value)"
      />
    </div>
    <div class="flex gap-1">
      <span class="mr-1 self-center font-mono text-[10px] text-muted">Sort:</span>
      <button
        v-for="[k, label] in [
          ['date', 'Date'],
          ['cue', 'Credibility'],
        ] as const"
        :key="k"
        type="button"
        class="tt-btn rounded-full px-4 py-2 text-xs font-medium"
        :class="
          sortBy === k
            ? 'border border-ink bg-ink text-surface'
            : 'border border-line bg-transparent text-muted'
        "
        :aria-pressed="sortBy === k"
        @click="emit('update:sortBy', k)"
      >
        {{ label }}
      </button>
    </div>
  </div>
</template>
