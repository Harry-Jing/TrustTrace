<script setup lang="ts">
import { computed } from "vue";

import BaseTagBadge from "@/components/BaseTagBadge.vue";
import { readVerdictCopy } from "@/features/checks/constants/resultFallbacks";
import type { BadgeTone } from "@/types/ui";
import type { CheckResultViewModel, VerdictBand } from "@/features/checks/types";

const props = defineProps<{
  result: CheckResultViewModel;
}>();

const verdictTone: Record<VerdictBand, BadgeTone> = {
  evidence_strong: "good",
  evidence_mixed: "accent",
  evidence_weak: "warn",
  evidence_thin: "warn",
  needs_context: "default",
  system_failed: "warn",
};

const verdictLabel = computed(() =>
  readVerdictCopy(props.result.verdictBand, "label", props.result.verdictLabel),
);
const headline = computed(() =>
  readVerdictCopy(props.result.verdictBand, "headline", props.result.headline),
);
const description = computed(() =>
  readVerdictCopy(props.result.verdictBand, "description", props.result.description),
);
</script>

<template>
  <!-- Breadcrumb row: which check this is. De-emphasized (no card chrome,
       small mono text) so it reads as orienting metadata, not as content
       competing with the verdict h1 below. -->
  <div class="mb-5 flex flex-wrap items-baseline gap-x-3 gap-y-1" aria-label="Checked input">
    <span class="font-mono text-[10px] tracking-[0.12em] text-muted uppercase">checked</span>
    <span class="min-w-0 flex-1 truncate font-mono text-[12px] text-ink-2">
      &ldquo;{{ result.inputText }}&rdquo;
    </span>
    <span class="font-mono text-[11px] tracking-[0.04em] text-muted">
      {{ result.inputTypeLabel }} &middot; {{ result.durationLabel }}
    </span>
  </div>

  <!-- Verdict band tag -->
  <div class="mb-3 stagger-1">
    <BaseTagBadge :tone="verdictTone[result.verdictBand]">{{ verdictLabel }}</BaseTagBadge>
  </div>

  <!-- Headline + description -->
  <h1 class="mb-3 stagger-2 font-serif text-[clamp(28px,4.2vw,40px)] leading-[1.15] tracking-tight">
    {{ headline }}
  </h1>
  <p class="mb-2 max-w-[640px] stagger-2 text-[14px] leading-[1.7] text-ink-2">
    {{ description }}
  </p>
</template>
