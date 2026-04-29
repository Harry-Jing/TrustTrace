<script setup lang="ts">
import { computed } from "vue";

import EvidenceRelationBadge from "@/features/checks/components/EvidenceRelationBadge.vue";
import { evidenceRelationToneFor } from "@/features/checks/constants/evidenceRelationTone";
import {
  evidenceTierToneBarClasses,
  evidenceTierToneBorderLeftClasses,
  evidenceTierToneFor,
  evidenceTierToneNumberClasses,
} from "@/features/checks/constants/evidenceTierTone";
import type { EvidenceItem, EvidenceTier } from "@/features/checks/types";
import { isSafeHttpUrl } from "@/features/checks/utils";

const props = defineProps<{
  evidence: readonly EvidenceItem[];
}>();

interface TierConfig {
  tier: EvidenceTier;
  label: string;
  description: string;
  numberClass: string;
  borderClass: string;
  barClass: string;
}

function tierConfigFor(tier: EvidenceTier, label: string, description: string): TierConfig {
  const tone = evidenceTierToneFor(tier);
  return {
    tier,
    label,
    description,
    numberClass: evidenceTierToneNumberClasses(tone),
    borderClass: evidenceTierToneBorderLeftClasses(tone),
    barClass: evidenceTierToneBarClasses(tone),
  };
}

const TIERS: readonly TierConfig[] = [
  tierConfigFor(
    1,
    "Primary, full-text, independent",
    "Original sources, complete article body, no shared origin. Strongest weight.",
  ),
  tierConfigFor(
    2,
    "Secondary, full-text, independent",
    "Trusted agency or aggregator coverage with full body extracted.",
  ),
  tierConfigFor(
    3,
    "Same-origin or limited",
    "Useful context but weighted lower — shares origin with a stronger source.",
  ),
  tierConfigFor(
    4,
    "Snippet-only",
    "Suggestive, not load-bearing. Cannot independently support a strong claim.",
  ),
];

const groupedEvidence = computed(() =>
  TIERS.map((tierConfig) => ({
    config: tierConfig,
    items: props.evidence.filter((entry) => entry.tier === tierConfig.tier),
  })),
);

function scopeMatchStyle(scope: number) {
  return { "--evidence-scope": String(Math.max(0, Math.min(1, scope))) };
}

function evidenceHref(item: EvidenceItem) {
  return isSafeHttpUrl(item.url) ? item.url : null;
}
</script>

<template>
  <div class="space-y-10">
    <section v-for="group in groupedEvidence" :key="group.config.tier" class="animate-up">
      <header class="mb-4 flex items-start gap-4">
        <div
          class="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border-[1.5px] font-mono text-body-sm transition-colors duration-400"
          :class="group.config.numberClass"
        >
          {{ group.config.tier }}
        </div>
        <div class="flex-1">
          <div class="flex flex-wrap items-baseline justify-between gap-2">
            <h2 class="font-serif text-lg font-semibold tracking-tight">
              {{ group.config.label }}
            </h2>
            <span class="font-mono text-label text-foreground-subtle">
              {{ group.items.length }} {{ group.items.length === 1 ? "source" : "sources" }}
            </span>
          </div>
          <p class="mt-1 text-body-sm leading-[1.65] text-foreground-muted">
            {{ group.config.description }}
          </p>
        </div>
      </header>

      <p v-if="group.items.length === 0" class="ml-12 text-xs text-foreground-subtle italic">
        No source landed at this tier.
      </p>

      <div v-else class="ml-12 space-y-3">
        <article
          v-for="(item, index) in group.items"
          :key="`${group.config.tier}-${index}`"
          class="overflow-hidden rounded-lg border border-border bg-card py-4 pr-4 pl-4 transition-colors duration-400"
          :class="group.config.borderClass"
        >
          <div class="mb-1.5 flex flex-wrap items-center gap-2">
            <span class="font-mono text-label font-medium text-accent">
              {{ item.domain }}
            </span>
            <span class="font-mono text-label text-foreground-subtle">{{ item.date }}</span>
            <EvidenceRelationBadge :tone="evidenceRelationToneFor(item.relation)">
              {{ item.relation }}
            </EvidenceRelationBadge>
            <span
              v-if="item.clusterId"
              class="rounded-full border border-border bg-surface px-2 py-0.5 font-mono text-micro tracking-[0.04em] text-foreground-subtle"
            >
              {{ item.clusterId }}
            </span>
          </div>
          <h3 class="mb-1 text-body leading-snug font-semibold">{{ item.title }}</h3>
          <p class="text-body-sm text-foreground-muted">{{ item.text }}</p>

          <div class="mt-3 flex items-center gap-4">
            <span class="font-mono text-eyebrow text-foreground-subtle uppercase">scope match</span>
            <div class="flex h-0.75 w-32 overflow-hidden rounded-sm bg-border">
              <div
                class="ladder-scope-bar h-full origin-left rounded-sm transition-transform duration-600 ease-out"
                :class="group.config.barClass"
                :style="scopeMatchStyle(item.scopeMatch)"
              />
            </div>
            <a
              v-if="evidenceHref(item)"
              :href="evidenceHref(item) ?? undefined"
              target="_blank"
              rel="noopener noreferrer"
              :aria-label="`Open ${item.title}`"
              class="ml-auto font-mono text-label font-medium text-accent"
            >
              open ↗
            </a>
            <span v-else class="ml-auto font-mono text-label text-foreground-subtle">
              link unavailable
            </span>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<style scoped>
.ladder-scope-bar {
  width: 100%;
  transform: scaleX(var(--evidence-scope, 0));
}
</style>
