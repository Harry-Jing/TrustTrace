<script setup lang="ts">
import { ref, useId } from 'vue'

defineProps<{
  text: string
}>()

const show = ref(false)
const tooltipId = `cue-tooltip-${useId()}`
</script>

<template>
  <span class="relative inline-flex">
    <button
      type="button"
      class="inline-flex size-6 cursor-help items-center justify-center rounded-full border border-line bg-transparent text-[10px] text-muted"
      :aria-describedby="show ? tooltipId : undefined"
      @focus="show = true"
      @blur="show = false"
      @mouseenter="show = true"
      @mouseleave="show = false"
      @keydown.escape="show = false"
    >
      ?
    </button>
    <Transition enter-active-class="anim-tooltip-in" leave-active-class="anim-tooltip-out">
      <div
        v-if="show"
        :id="tooltipId"
        role="tooltip"
        class="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-10 w-[260px] -translate-x-1/2 rounded-md bg-ink p-3 text-xs leading-relaxed text-surface shadow-lg"
      >
        {{ text }}
        <div class="absolute -bottom-1 left-1/2 size-2 -translate-x-1/2 rotate-45 bg-ink" />
      </div>
    </Transition>
  </span>
</template>
