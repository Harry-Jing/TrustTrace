<script setup lang="ts">
defineProps<{
  text: string;
}>();
</script>

<template>
  <aside class="flex items-start gap-3 rounded-lg border border-border bg-surface px-4 py-3">
    <span class="mt-px font-mono text-eyebrow text-warning uppercase">note</span>
    <p class="text-body-sm leading-[1.65] text-foreground-muted">{{ text }}</p>
  </aside>
</template>
