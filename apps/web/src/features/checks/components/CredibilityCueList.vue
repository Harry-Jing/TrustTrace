<script setup lang="ts">
import CueTooltip from '@/features/checks/components/CueTooltip.vue'
import type { CredibilityCue } from '@/features/checks/types'

defineProps<{
  cues: readonly CredibilityCue[]
}>()
</script>

<template>
  <div class="mb-7">
    <span class="mb-3 block font-mono text-[10px] tracking-[0.1em] text-accent uppercase">
      credibility cues · {{ cues.length }} signals
    </span>
    <div v-for="(cue, i) in cues" :key="i" class="border-t border-line py-4">
      <div class="mb-1.5 flex items-center gap-2">
        <span class="text-body-sm flex-1 font-semibold">{{ cue.name }}</span>
        <CueTooltip :text="cue.tooltip" />
        <!-- Strength dots -->
        <div class="flex gap-[3px]" :aria-label="`Strength ${cue.strength} of 5`" role="img">
          <div
            v-for="d in 5"
            :key="d"
            class="size-[5px] rounded-full transition-colors duration-300"
            :class="d <= cue.strength ? 'bg-accent' : 'bg-line'"
          />
        </div>
      </div>
      <div class="text-body-sm leading-[1.7] text-ink-2">{{ cue.text }}</div>
      <div class="mt-1 text-[11px] text-muted italic">{{ cue.note }}</div>
    </div>
  </div>
</template>
