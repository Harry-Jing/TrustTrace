<script setup lang="ts">
const columns = [
  { title: "What you get", description: "Source cues, evidence items, and uncertainty notes." },
  {
    title: "What you don't",
    description: "No binary verdict. No truth score. No context-free certainty.",
  },
  {
    title: "Open by design",
    description: "Every source, cue, and uncertainty note is shown — nothing is hidden.",
  },
];
</script>

<template>
  <div class="mt-10 grid animate-up grid-cols-1 text-left [animation-delay:440ms] md:grid-cols-3">
    <div
      v-for="(column, i) in columns"
      :key="i"
      class="px-6 py-5"
      :class="i > 0 ? 'md:border-l md:border-border' : ''"
    >
      <div class="mb-2 font-serif text-h4 text-foreground">{{ column.title }}</div>
      <div class="text-body-sm text-foreground-muted">{{ column.description }}</div>
    </div>
  </div>
</template>
