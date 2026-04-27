<script setup lang="ts">
import { computed } from "vue";

import BaseTagBadge from "@/components/BaseTagBadge.vue";
import type { BadgeTone } from "@/types/ui";
import type { EvidenceItem, EvidenceRelation, EvidenceTier } from "@/features/checks/types";
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

const TIERS: readonly TierConfig[] = [
  {
    tier: 1,
    label: "Primary, full-text, independent",
    description: "Original sources, complete article body, no shared origin. Strongest weight.",
    numberClass: "border-good bg-good text-card",
    borderClass: "border-l-[3px] border-l-good",
    barClass: "bg-good",
  },
  {
    tier: 2,
    label: "Secondary, full-text, independent",
    description: "Trusted agency or aggregator coverage with full body extracted.",
    numberClass: "border-accent bg-accent text-white",
    borderClass: "border-l-[3px] border-l-accent",
    barClass: "bg-accent",
  },
  {
    tier: 3,
    label: "Same-origin or limited",
    description: "Useful context but weighted lower — shares origin with a stronger source.",
    numberClass: "border-line-strong bg-surface-alt text-ink-2",
    borderClass: "border-l-[3px] border-l-line-strong",
    barClass: "bg-muted",
  },
  {
    tier: 4,
    label: "Snippet-only",
    description: "Suggestive, not load-bearing. Cannot independently support a strong claim.",
    numberClass: "border-warn bg-warn text-white",
    borderClass: "border-l-[3px] border-l-warn",
    barClass: "bg-warn",
  },
];

const relationConfig: Record<EvidenceRelation, { label: string; tone: BadgeTone }> = {
  supports: { label: "supports", tone: "good" },
  contradicts: { label: "contradicts", tone: "warn" },
  neutral: { label: "neutral", tone: "default" },
};

const groupedEvidence = computed(() =>
  TIERS.map((tierConfig) => ({
    config: tierConfig,
    items: props.evidence.filter((entry) => entry.tier === tierConfig.tier),
  })),
);

function scopeMatchStyle(scope: number) {
  return { "--tt-scope": String(Math.max(0, Math.min(1, scope))) };
}

function evidenceHref(item: EvidenceItem) {
  return isSafeHttpUrl(item.url) ? item.url : null;
}
</script>

<template>
  <div class="space-y-10">
    <section v-for="group in groupedEvidence" :key="group.config.tier" class="anim-up">
      <header class="mb-4 flex items-start gap-4">
        <div
          class="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border-[1.5px] font-mono text-[13px] transition-colors duration-400"
          :class="group.config.numberClass"
        >
          {{ group.config.tier }}
        </div>
        <div class="flex-1">
          <div class="flex flex-wrap items-baseline justify-between gap-2">
            <h2 class="font-serif text-[18px] font-semibold tracking-tight">
              {{ group.config.label }}
            </h2>
            <span class="font-mono text-[11px] tracking-[0.04em] text-muted">
              {{ group.items.length }} {{ group.items.length === 1 ? "source" : "sources" }}
            </span>
          </div>
          <p class="mt-1 text-[13px] leading-[1.65] text-ink-2">
            {{ group.config.description }}
          </p>
        </div>
      </header>

      <p v-if="group.items.length === 0" class="ml-12 text-[12px] text-muted italic">
        No source landed at this tier.
      </p>

      <div v-else class="ml-12 space-y-3">
        <article
          v-for="(item, index) in group.items"
          :key="`${group.config.tier}-${index}`"
          class="overflow-hidden rounded-lg border border-line bg-card py-4 pr-4 pl-4 transition-colors duration-400"
          :class="group.config.borderClass"
        >
          <div class="mb-1.5 flex flex-wrap items-center gap-2">
            <span class="font-mono text-[11px] font-medium tracking-[0.04em] text-warn">
              {{ item.domain }}
            </span>
            <span class="font-mono text-[11px] tracking-[0.04em] text-muted">{{ item.date }}</span>
            <BaseTagBadge :tone="relationConfig[item.relation].tone" class="text-[9px]">
              {{ relationConfig[item.relation].label }}
            </BaseTagBadge>
            <span
              v-if="item.clusterId"
              class="rounded-full border border-line bg-surface-alt px-2 py-0.5 font-mono text-[9px] tracking-[0.04em] text-muted"
            >
              {{ item.clusterId }}
            </span>
          </div>
          <h3 class="mb-1 text-[15px] leading-snug font-semibold">{{ item.title }}</h3>
          <p class="text-[13px] leading-[1.7] text-ink-2">{{ item.text }}</p>

          <div class="mt-3 flex items-center gap-4">
            <span class="font-mono text-[10px] tracking-[0.06em] text-muted uppercase"
              >scope match</span
            >
            <div class="flex h-[3px] w-32 overflow-hidden rounded-sm bg-line">
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
              class="ml-auto font-mono text-[11px] font-medium tracking-[0.04em] text-warn"
            >
              open ↗
            </a>
            <span v-else class="ml-auto font-mono text-[11px] tracking-[0.04em] text-muted">
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
  transform: scaleX(var(--tt-scope, 0));
}
</style>
