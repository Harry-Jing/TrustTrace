<script setup lang="ts">
import {
  TooltipArrow,
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from "reka-ui";

defineProps<{
  text: string;
}>();
</script>

<template>
  <TooltipProvider :delay-duration="0" :skip-delay-duration="100">
    <TooltipRoot>
      <TooltipTrigger as-child>
        <button
          type="button"
          class="inline-flex size-6 cursor-help items-center justify-center rounded-full border border-line bg-transparent text-[10px] text-muted"
          aria-label="Show details for this credibility cue"
        >
          ?
        </button>
      </TooltipTrigger>
      <TooltipPortal>
        <TooltipContent
          side="top"
          :side-offset="8"
          :collision-padding="12"
          class="z-50 w-65 rounded-md bg-ink p-3 text-xs leading-relaxed text-surface shadow-lg data-[state=closed]:anim-tooltip-out data-[state=delayed-open]:anim-tooltip-in data-[state=instant-open]:anim-tooltip-in"
        >
          {{ text }}
          <TooltipArrow class="fill-ink" :width="10" :height="5" />
        </TooltipContent>
      </TooltipPortal>
    </TooltipRoot>
  </TooltipProvider>
</template>
