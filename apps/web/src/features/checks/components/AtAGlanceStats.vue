<script setup lang="ts">
import { computed } from "vue";

import { UNCERTAINTY_LEVEL_TEXT_CLASSES } from "@/features/checks/constants/uncertaintyLevelClasses";
import type { ResultAtAGlance } from "@/features/checks/types";

const props = defineProps<{
  glance: ResultAtAGlance;
}>();

interface GlanceStat {
  value: string;
  label: string;
  toneClass: string;
}

const stats = computed<readonly GlanceStat[]>(() => [
  {
    value: String(props.glance.evidence),
    label: "evidence",
    toneClass: "text-foreground",
  },
  {
    value: String(props.glance.independent),
    label: "independent",
    toneClass: "text-foreground",
  },
  {
    value: String(props.glance.fullText),
    label: "full-text",
    toneClass: "text-accent",
  },
  {
    value: String(props.glance.primary),
    label: "primary",
    toneClass: "text-accent",
  },
  {
    value: String(props.glance.snippet),
    label: "snippet",
    toneClass: "text-foreground-muted",
  },
  {
    value: props.glance.uncertainty,
    label: "uncertainty",
    toneClass: UNCERTAINTY_LEVEL_TEXT_CLASSES[props.glance.uncertainty],
  },
]);
</script>

<template>
  <section>
    <span class="mb-3 block font-mono text-eyebrow text-foreground-subtle uppercase">
      at a glance
    </span>
    <dl class="grid grid-cols-2 gap-x-5 gap-y-4">
      <div v-for="stat in stats" :key="stat.label">
        <dt class="font-mono text-eyebrow text-foreground-subtle uppercase">
          {{ stat.label }}
        </dt>
        <dd class="mt-1 font-serif text-stat tracking-tight" :class="stat.toneClass">
          {{ stat.value }}
        </dd>
      </div>
    </dl>
  </section>
</template>
