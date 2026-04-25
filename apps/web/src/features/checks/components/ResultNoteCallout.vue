<script setup lang="ts">
defineProps<{
  text: string
}>()
</script>

<template>
  <aside class="flex items-start gap-3 rounded-lg border border-line bg-surface-alt px-4 py-3">
    <span class="mt-px font-mono text-[10px] tracking-[0.12em] text-warn uppercase">note</span>
    <p class="text-[13px] leading-[1.65] text-ink-2">{{ text }}</p>
  </aside>
</template>
