<script setup lang="ts">
import BaseTagBadge from '@/components/BaseTagBadge.vue'
import type { CheckResultViewModel, ResultStatTone } from '@/features/checks/types'

defineProps<{
  result: CheckResultViewModel
}>()

function statToneClass(tone: ResultStatTone) {
  if (tone === 'accent') return 'text-accent'
  if (tone === 'warn') return 'text-warn'
  return 'text-muted'
}

function statBarClass(tone: ResultStatTone) {
  if (tone === 'accent') return 'bg-accent'
  if (tone === 'warn') return 'bg-warn'
  return 'bg-muted'
}

function statBarStyle(value: number) {
  return { '--tt-stat-bar-value': String(value) }
}
</script>

<template>
  <!-- Input echo -->
  <div
    class="text-body-sm mb-5 flex stagger-1 items-center gap-2.5 rounded-md bg-surface-alt px-4 py-2.5 text-ink-2"
  >
    <span class="shrink-0 font-mono text-[10px] tracking-[0.08em] text-accent uppercase">
      checked
    </span>
    <span class="flex-1 truncate italic">"{{ result.inputText }}"</span>
    <span class="shrink-0 font-mono text-[10px] text-muted">{{ result.inputTypeLabel }}</span>
  </div>

  <!-- Summary -->
  <div class="mb-8 stagger-2">
    <div class="mb-2 flex items-center gap-2.5">
      <BaseTagBadge tone="accent">{{ result.statusCue }}</BaseTagBadge>
      <BaseTagBadge>{{ result.summaryState }}</BaseTagBadge>
      <span class="font-mono text-xs tracking-[0.03em] text-muted">{{ result.completedMeta }}</span>
    </div>
    <h1 class="mb-2.5 font-serif text-[clamp(24px,3.5vw,34px)] leading-[1.2] tracking-tight">
      {{ result.headline }}
    </h1>
    <p class="mb-5 max-w-[640px] text-sm leading-[1.75] text-ink-2">
      {{ result.description }}
    </p>

    <!-- Stats row -->
    <div class="flex flex-wrap items-end gap-8 border-b border-line pb-5">
      <div v-for="(stat, index) in result.stats" :key="index">
        <div class="font-serif text-2xl leading-none" :class="statToneClass(stat.tone)">
          {{ stat.value }}
        </div>
        <span class="font-mono text-[10px] tracking-[0.08em] text-muted uppercase">{{
          stat.label
        }}</span>
        <!-- Mini bar -->
        <div class="mt-1.5 h-[3px] w-12 rounded-sm bg-line">
          <div
            class="stat-bar-fill h-full rounded-sm transition-transform duration-600 ease-out"
            :class="statBarClass(stat.tone)"
            :style="statBarStyle(stat.barRatio)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
