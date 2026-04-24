<script setup lang="ts">
import type { CheckPhase } from '@/features/checks/types'

defineProps<{
  phases: readonly CheckPhase[]
  phaseIndex: number
  tip: string
}>()
</script>

<template>
  <div class="md:sticky md:top-20">
    <div
      v-for="(phaseOption, index) in phases"
      :key="phaseOption"
      class="relative flex items-start gap-3.5"
    >
      <!-- Timeline connector -->
      <div
        v-if="index < phases.length - 1"
        class="absolute top-10 left-[19px] h-8 w-0.5 transition-colors duration-400"
        :class="index < phaseIndex ? 'bg-accent' : 'bg-line'"
      >
        <div
          v-if="index === phaseIndex"
          class="absolute top-0 -left-px size-1 anim-timeline-pulse rounded-full bg-accent"
        />
      </div>

      <!-- Number circle -->
      <div class="pt-3 pb-5">
        <div
          class="flex size-10 shrink-0 items-center justify-center rounded-full font-mono text-sm font-medium transition-all duration-300"
          :class="{
            'border-[1.5px] border-accent bg-accent text-surface': index < phaseIndex,
            'border-[1.5px] border-ink bg-ink text-surface': index === phaseIndex,
            'border-[1.5px] border-line-strong bg-transparent text-muted': index > phaseIndex,
          }"
        >
          {{ String(index + 1).padStart(2, '0') }}
        </div>
      </div>

      <!-- Label -->
      <div class="pt-4 pb-5">
        <div
          class="text-body-sm transition-all duration-300"
          :class="{
            'font-semibold text-accent': index < phaseIndex,
            'font-semibold text-ink': index === phaseIndex,
            'font-normal text-muted': index > phaseIndex,
          }"
        >
          {{ phaseOption }}
        </div>
        <span class="font-mono text-[11px] tracking-[0.03em] text-muted">
          {{ index < phaseIndex ? 'done' : index === phaseIndex ? 'in progress…' : 'queued' }}
        </span>
      </div>
    </div>

    <!-- While you wait tip -->
    <div class="mt-3 border-t border-line pt-4">
      <span class="mb-2 block font-mono text-[10px] tracking-[0.1em] text-accent uppercase">
        while you wait
      </span>
      <div class="text-body-sm leading-relaxed text-ink-2 italic">
        {{ tip }}
      </div>
    </div>

    <!-- DEV: slot for dev-only phase controls -->
    <slot />
  </div>
</template>
