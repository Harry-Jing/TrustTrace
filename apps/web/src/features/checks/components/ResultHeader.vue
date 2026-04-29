<script setup lang="ts">
import { computed } from "vue";

import EvidenceBadge from "@/features/checks/components/EvidenceBadge.vue";
import { evidenceToneFor } from "@/features/checks/constants/evidenceTone";
import { readVerdictCopy } from "@/features/checks/constants/resultFallbacks";
import type { CheckResultViewModel } from "@/features/checks/types";

const props = defineProps<{
  result: CheckResultViewModel;
}>();

const verdictTone = computed(() => evidenceToneFor(props.result.verdictBand));
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
    <span class="font-mono text-eyebrow text-foreground-subtle uppercase">checked</span>
    <span class="min-w-0 flex-1 truncate font-mono text-xs text-foreground-muted">
      &ldquo;{{ result.inputText }}&rdquo;
    </span>
    <span class="font-mono text-label text-foreground-subtle">
      {{ result.inputTypeLabel }} &middot; {{ result.durationLabel }}
    </span>
  </div>

  <!-- Verdict band tag -->
  <div class="mb-3 animate-up [animation-delay:50ms]">
    <EvidenceBadge :tone="verdictTone">{{ verdictLabel }}</EvidenceBadge>
  </div>

  <!-- Headline + description -->
  <h1 class="mb-3 animate-up font-serif text-display-md [animation-delay:100ms]">
    {{ headline }}
  </h1>
  <p
    class="mb-2 max-w-160 animate-up text-sm leading-[1.7] text-foreground-muted [animation-delay:100ms]"
  >
    {{ description }}
  </p>
</template>
