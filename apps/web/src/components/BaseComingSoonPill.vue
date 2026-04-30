<script setup lang="ts">
withDefaults(defineProps<{ label?: string }>(), { label: "coming soon" });
</script>

<template>
  <span
    class="inline-flex items-center rounded-full border border-border bg-surface px-2 py-0.5 font-mono text-eyebrow text-foreground-subtle uppercase"
  >
    {{ label }}
  </span>
</template>
