<script setup lang="ts">
const columns = [
  { title: 'What you get', description: 'Source cues, evidence items, and uncertainty notes.' },
  {
    title: "What you don't",
    description: 'No binary verdict. No truth score. No context-free certainty.',
  },
  {
    title: 'Open by design',
    description: 'Every source, cue, and uncertainty note is shown — nothing is hidden.',
  },
]
</script>

<template>
  <div class="mt-10 grid stagger-7 grid-cols-1 text-left md:grid-cols-[1.2fr_1fr_0.8fr]">
    <div
      v-for="(column, i) in columns"
      :key="i"
      class="px-6 py-5"
      :class="i > 0 ? 'md:border-l md:border-line' : ''"
    >
      <div class="mb-2 font-serif text-[17px] text-ink">{{ column.title }}</div>
      <div class="text-body-sm leading-[1.75] text-muted">{{ column.description }}</div>
    </div>
  </div>
</template>
