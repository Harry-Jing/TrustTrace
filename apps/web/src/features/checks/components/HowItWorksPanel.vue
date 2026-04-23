<script setup lang="ts">
import { ref } from 'vue'

const showHow = ref(false)
const panelId = 'how-trusttrace-works'
const howSteps = [
  {
    title: 'You submit',
    description: 'Paste a URL or text claim. Works with articles, tweets, and short excerpts.',
  },
  {
    title: 'AI searches live sources',
    description: 'We query multiple providers with web search enabled — not a static database.',
  },
  {
    title: 'Evidence streams in',
    description: 'You see sources, cues, and uncertainty as they’re found — in real time.',
  },
  {
    title: 'You decide',
    description: 'No binary verdict. Just context to help you pause before sharing.',
  },
]
</script>

<template>
  <div class="mt-7 stagger-5 text-left">
    <button
      class="text-body-sm flex w-full items-center gap-2 rounded-lg border border-line bg-card px-4 py-3 font-medium text-ink transition-colors duration-150 hover:bg-surface-alt"
      :aria-controls="panelId"
      :aria-expanded="showHow"
      @click="showHow = !showHow"
    >
      <span class="text-sm" aria-hidden="true">?</span>
      <span class="flex-1 text-left">How does TrustTrace work?</span>
      <span
        class="text-[11px] text-muted transition-transform duration-200"
        :class="showHow ? 'rotate-180' : ''"
        aria-hidden="true"
        >&#9660;</span
      >
    </button>
    <div class="expand-panel" :data-open="showHow">
      <div class="expand-panel__inner">
        <div
          :id="panelId"
          class="grid grid-cols-1 gap-4 rounded-b-lg border border-t-0 border-line bg-card p-5 min-[481px]:grid-cols-2 md:grid-cols-4"
        >
          <div v-for="(step, i) in howSteps" :key="i">
            <div
              class="mb-2 flex size-7 items-center justify-center rounded-full bg-accent font-mono text-xs font-semibold text-white"
            >
              {{ i + 1 }}
            </div>
            <div class="text-body-sm mb-1 font-semibold">{{ step.title }}</div>
            <div class="text-xs leading-relaxed text-muted">{{ step.description }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
