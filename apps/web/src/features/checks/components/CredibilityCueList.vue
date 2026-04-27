<script setup lang="ts">
import CueTooltip from "@/features/checks/components/CueTooltip.vue";
import type { CredibilityCue } from "@/features/checks/types";

defineProps<{
  cues: readonly CredibilityCue[];
}>();
</script>

<template>
  <section>
    <span class="mb-3 block font-mono text-[10px] tracking-[0.12em] text-muted uppercase">
      credibility cues
    </span>
    <div
      v-for="(cue, i) in cues"
      :key="i"
      class="border-t border-line py-3 first:border-t-0 first:pt-0"
    >
      <div class="mb-1 flex items-center gap-2">
        <span class="flex-1 text-[13px] leading-snug font-semibold">{{ cue.name }}</span>
        <CueTooltip :text="cue.tooltip" />
        <div class="flex gap-0.75" :aria-label="`Strength ${cue.strength} of 5`" role="img">
          <div
            v-for="d in 5"
            :key="d"
            class="size-1.25 rounded-full transition-colors duration-300"
            :class="d <= cue.strength ? 'bg-warn' : 'bg-line'"
          />
        </div>
      </div>
      <div class="text-[12px] leading-[1.6] text-ink-2">{{ cue.text }}</div>
    </div>
  </section>
</template>
