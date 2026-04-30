<script setup lang="ts">
import type { CheckListSort } from "@/features/checks/types";

defineProps<{
  search: string;
  sortBy: CheckListSort;
}>();

const emit = defineEmits<{
  "update:search": [value: string];
  "update:sortBy": [value: CheckListSort];
}>();
</script>

<template>
  <div class="flex animate-up flex-wrap items-center gap-2.5 [animation-delay:100ms]">
    <div
      class="flex h-9 min-w-50 flex-1 items-center gap-2 rounded-lg border border-border bg-card px-4 transition-[border-color] duration-200 focus-within:border-accent"
    >
      <svg
        class="size-4 shrink-0 text-foreground-subtle"
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
        class="flex-1 border-none bg-transparent text-body-sm text-foreground outline-none"
        @input="emit('update:search', ($event.target as HTMLInputElement).value)"
      />
    </div>
    <div class="flex gap-1">
      <span class="mr-1 self-center font-mono text-caption text-foreground-subtle">Sort:</span>
      <button
        v-for="[k, label] in [
          ['date', 'Date'],
          ['cue', 'Credibility'],
        ] as const"
        :key="k"
        type="button"
        class="tt-btn flex h-9 items-center rounded-full px-4 text-caption font-medium"
        :class="
          sortBy === k
            ? 'border border-foreground bg-foreground text-background'
            : 'border border-border bg-transparent text-foreground-subtle'
        "
        :aria-pressed="sortBy === k"
        @click="emit('update:sortBy', k)"
      >
        {{ label }}
      </button>
    </div>
  </div>
</template>
