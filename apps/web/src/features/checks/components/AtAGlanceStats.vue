<script setup lang="ts">
import { computed } from 'vue'

import type { ResultAtAGlance, UncertaintyLevel } from '@/features/checks/types'

const props = defineProps<{
  glance: ResultAtAGlance
}>()

interface GlanceStat {
  value: string
  label: string
  toneClass: string
}

const uncertaintyTone: Record<UncertaintyLevel, string> = {
  low: 'text-good',
  med: 'text-warn',
  high: 'text-warn',
}

const stats = computed<readonly GlanceStat[]>(() => [
  {
    value: String(props.glance.evidence),
    label: 'evidence',
    toneClass: 'text-ink',
  },
  {
    value: String(props.glance.independent),
    label: 'independent',
    toneClass: 'text-ink',
  },
  {
    value: String(props.glance.fullText),
    label: 'full-text',
    toneClass: 'text-good',
  },
  {
    value: String(props.glance.primary),
    label: 'primary',
    toneClass: 'text-accent',
  },
  {
    value: String(props.glance.snippet),
    label: 'snippet',
    toneClass: 'text-ink-2',
  },
  {
    value: props.glance.uncertainty,
    label: 'uncertainty',
    toneClass: uncertaintyTone[props.glance.uncertainty],
  },
])
</script>

<template>
  <section>
    <span class="mb-3 block font-mono text-[10px] tracking-[0.12em] text-muted uppercase">
      at a glance
    </span>
    <dl class="grid grid-cols-2 gap-x-5 gap-y-4">
      <div v-for="stat in stats" :key="stat.label">
        <dt class="font-mono text-[10px] tracking-[0.08em] text-muted uppercase">
          {{ stat.label }}
        </dt>
        <dd class="mt-1 font-serif text-[26px] leading-none tracking-tight" :class="stat.toneClass">
          {{ stat.value }}
        </dd>
      </div>
    </dl>
  </section>
</template>
