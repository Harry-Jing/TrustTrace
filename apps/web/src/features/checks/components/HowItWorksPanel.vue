<script setup lang="ts">
import { ref } from "vue";

const showHow = ref(false);
const panelId = "how-trusttrace-works";
const howSteps = [
  {
    title: "You submit",
    description: "Paste a URL or text claim. Works with articles, tweets, and short excerpts.",
  },
  {
    title: "AI searches live sources",
    description:
      "Your chosen discovery strategy queries the live web for candidate sources — not a static database.",
  },
  {
    title: "Evidence streams in",
    description: "You see sources, cues, and uncertainty as they’re found — in real time.",
  },
  {
    title: "You decide",
    description: "No binary verdict. Just context to help you pause before sharing.",
  },
];
</script>

<template>
  <div class="mt-7 animate-up text-left [animation-delay:300ms]">
    <button
      type="button"
      class="flex w-full items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-body-sm font-medium text-foreground transition-colors duration-150 hover:bg-surface"
      :aria-controls="panelId"
      :aria-expanded="showHow"
      @click="showHow = !showHow"
    >
      <svg
        class="size-4 shrink-0 text-foreground-subtle"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.6"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M9.6 9.5a2.4 2.4 0 014.8 0c0 1.6-2.4 1.8-2.4 3.5" />
        <path d="M12 17v.01" />
      </svg>
      <span class="flex-1 text-left">How does TrustTrace work?</span>
      <svg
        class="size-3.5 shrink-0 text-foreground-subtle transition-transform duration-200"
        :class="showHow ? 'rotate-180' : ''"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </button>
    <div class="expand-panel" :data-open="showHow">
      <div class="expand-panel-inner">
        <div
          :id="panelId"
          class="grid grid-cols-1 gap-4 rounded-b-lg border border-t-0 border-border bg-card p-5 min-[481px]:grid-cols-2 md:grid-cols-4"
        >
          <div v-for="(step, i) in howSteps" :key="i">
            <div
              class="mb-2 flex size-7 items-center justify-center rounded-full bg-accent font-mono text-caption font-semibold text-card"
            >
              {{ i + 1 }}
            </div>
            <div class="mb-1 text-body-sm font-semibold">{{ step.title }}</div>
            <div class="text-caption text-foreground-subtle">{{ step.description }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
