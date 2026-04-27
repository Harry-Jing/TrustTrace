<script setup lang="ts">
import type { BadgeTone } from "@/types/ui";

withDefaults(
  defineProps<{
    tone?: BadgeTone;
  }>(),
  { tone: "default" },
);
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[11px] font-medium tracking-[0.04em] uppercase transition-colors duration-400"
    :class="{
      'border border-line bg-surface-alt text-ink-2': tone === 'default',
      'border border-accent-light bg-accent-light text-accent': tone === 'accent',
      'border border-warn-light bg-warn-light text-warn': tone === 'warn',
      'border border-good-light bg-good-light text-good': tone === 'good',
      'border border-ink bg-ink text-surface': tone === 'dark',
    }"
  >
    <slot />
  </span>
</template>
