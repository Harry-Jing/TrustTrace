<script setup lang="ts">
import TagBadge from '@/components/TagBadge.vue'
import type { BadgeTone } from '@/types/ui'
import type { EvidenceItem, EvidenceRelation } from '@/features/checks/types'

defineProps<{
  evidence: readonly EvidenceItem[]
}>()

const relationConfig: Record<EvidenceRelation, { label: string; tone: BadgeTone }> = {
  supports: { label: 'supports', tone: 'accent' },
  contradicts: { label: 'contradicts', tone: 'warn' },
  neutral: { label: 'neutral', tone: 'default' },
}
</script>

<template>
  <div>
    <div class="mb-3 flex items-center justify-between">
      <span class="font-mono text-[10px] tracking-[0.1em] text-accent uppercase">
        evidence items
      </span>
      <span class="font-mono text-xs tracking-[0.03em] text-muted">
        {{ evidence.length }} sources
      </span>
    </div>

    <div v-for="(ev, i) in evidence" :key="i" class="mb-0.5 flex">
      <div
        class="w-[3px] shrink-0 opacity-50"
        :class="[
          i === 0 ? 'rounded-tl-[3px]' : '',
          ev.relation === 'contradicts' ? 'bg-warn' : 'bg-accent',
        ]"
      />
      <div class="flex-1 border-b border-line bg-card px-4.5 py-4 transition-colors duration-400">
        <div class="mb-1 flex flex-wrap items-center gap-2">
          <TagBadge :tone="relationConfig[ev.relation].tone" class="text-[9px]">
            {{ relationConfig[ev.relation].label }}
          </TagBadge>
          <span
            class="rounded-full border border-line bg-surface-alt px-1.5 py-0.5 font-mono text-[8px] text-muted"
          >
            {{ ev.credLabel }} {{ ev.domain }}
          </span>
          <span class="font-mono text-xs tracking-[0.03em] text-muted"
            >{{ ev.src }} &middot; {{ ev.date }}</span
          >
          <a
            :href="ev.url"
            target="_blank"
            :aria-label="`Open ${ev.title}`"
            rel="noopener noreferrer"
            class="ml-auto text-[11px] font-medium text-accent"
          >
            open ↗
          </a>
        </div>
        <div class="mb-[3px] text-sm leading-snug font-semibold">{{ ev.title }}</div>
        <div class="text-body-sm leading-[1.7] text-ink-2">{{ ev.text }}</div>
      </div>
    </div>
  </div>
</template>
