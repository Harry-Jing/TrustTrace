<script setup lang="ts">
withDefaults(defineProps<{ label?: string }>(), { label: "coming soon" });
</script>

<template>
  <span
    class="inline-flex items-center rounded-full border border-line bg-surface-alt px-2 py-0.5 font-mono text-eyebrow font-medium text-muted uppercase"
  >
    {{ label }}
  </span>
</template>
