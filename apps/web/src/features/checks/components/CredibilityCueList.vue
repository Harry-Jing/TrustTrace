<script setup lang="ts">
import CueTooltip from "@/features/checks/components/CueTooltip.vue";
import type { CredibilityCue } from "@/features/checks/types";

defineProps<{
  cues: readonly CredibilityCue[];
}>();
</script>

<template>
  <section>
    <span class="mb-3 block font-mono text-eyebrow text-foreground-subtle uppercase">
      credibility cues
    </span>
    <div
      v-for="(cue, i) in cues"
      :key="i"
      class="border-t border-border py-3 first:border-t-0 first:pt-0"
    >
      <div class="mb-1 flex items-center gap-2">
        <span class="flex-1 text-body-sm leading-snug font-semibold">{{ cue.name }}</span>
        <CueTooltip :text="cue.tooltip" />
        <div class="flex gap-0.75" :aria-label="`Strength ${cue.strength} of 5`" role="img">
          <div
            v-for="d in 5"
            :key="d"
            class="size-1.25 rounded-full transition-colors duration-300"
            :class="d <= cue.strength ? 'bg-warning' : 'bg-border'"
          />
        </div>
      </div>
      <!-- One-line editorial framing for the cue ("why this matters").
           Rendered between heading and body so the reader has a takeaway
           before the longer explanation. Quiet italic so it doesn't compete
           with the body text or the strength dots. -->
      <p v-if="cue.note" class="mb-1 text-[11px] leading-[1.5] text-foreground-subtle italic">
        {{ cue.note }}
      </p>
      <div class="text-xs leading-[1.6] text-foreground-muted">{{ cue.text }}</div>
    </div>
  </section>
</template>
