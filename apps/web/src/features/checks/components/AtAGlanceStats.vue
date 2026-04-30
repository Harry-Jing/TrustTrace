<script setup lang="ts">
import { computed } from "vue";

import CueTooltip from "@/features/checks/components/CueTooltip.vue";
import { UNCERTAINTY_LEVEL_TEXT_CLASSES } from "@/features/checks/constants/uncertaintyLevelClasses";
import type { ResultAtAGlance } from "@/features/checks/types";

const props = defineProps<{
  glance: ResultAtAGlance;
}>();

interface GlanceStat {
  value: string;
  label: string;
  tooltip: string;
  toneClass: string;
}

// Tooltip copy is colocated with the stat ordering so adding a new stat
// surfaces a TS gap if its tooltip is forgotten. The phrasing leans
// definitional rather than evaluative — readers should learn what the count
// counts, not what to think about it.
const stats = computed<readonly GlanceStat[]>(() => [
  {
    value: String(props.glance.evidence),
    label: "evidence",
    tooltip: "Total verified sources we found and weighed against this claim.",
    toneClass: "text-foreground",
  },
  {
    value: String(props.glance.independent),
    label: "independent",
    tooltip:
      "Sources that don't share a publisher or origin with another source — independent agreement is a stronger signal than echo.",
    toneClass: "text-foreground",
  },
  {
    value: String(props.glance.fullText),
    label: "full-text",
    tooltip:
      "Sources where we fetched the complete article body, not just a search-result snippet.",
    toneClass: "text-accent",
  },
  {
    value: String(props.glance.primary),
    label: "primary",
    tooltip:
      "Original sources (research, official statements, raw data) rather than reporting about another source.",
    toneClass: "text-accent",
  },
  {
    value: String(props.glance.snippet),
    label: "snippet",
    tooltip:
      "Sources we could only read as a search-result blurb — useful but not load-bearing on their own.",
    toneClass: "text-foreground-muted",
  },
  {
    value: props.glance.uncertainty,
    label: "uncertainty",
    tooltip:
      "How confident TrustTrace is in this verdict overall — high uncertainty means the evidence supports a tentative read, not a conclusion.",
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
        <dt class="flex items-center gap-1.5">
          <span class="font-mono text-eyebrow text-foreground-subtle uppercase">
            {{ stat.label }}
          </span>
          <CueTooltip :text="stat.tooltip" :label="`What does ${stat.label} mean?`" />
        </dt>
        <dd class="mt-1 font-serif text-h3" :class="stat.toneClass">
          {{ stat.value }}
        </dd>
      </div>
    </dl>
  </section>
</template>
