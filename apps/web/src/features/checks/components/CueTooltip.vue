<script setup lang="ts">
import { onBeforeUnmount, ref, useId } from "vue";

defineProps<{
  text: string;
}>();

const show = ref(false);
const tooltipId = `cue-tooltip-${useId()}`;

/**
 * The trigger button and the tooltip surface are not contiguous (there is an
 * 8px gap between them). Without a delay, moving the mouse from the button
 * toward the tooltip text triggers `mouseleave` on the button before the
 * pointer reaches the tooltip — and the tooltip closes before the user can
 * read it. We schedule a short close, and any `mouseenter` on the tooltip
 * itself cancels that pending close.
 */
const HOVER_GRACE_MS = 120;
let closeTimer: ReturnType<typeof setTimeout> | null = null;

function clearCloseTimer() {
  if (closeTimer === null) return;
  clearTimeout(closeTimer);
  closeTimer = null;
}

function open() {
  clearCloseTimer();
  show.value = true;
}

function scheduleClose() {
  clearCloseTimer();
  closeTimer = setTimeout(() => {
    show.value = false;
    closeTimer = null;
  }, HOVER_GRACE_MS);
}

function closeNow() {
  clearCloseTimer();
  show.value = false;
}

onBeforeUnmount(clearCloseTimer);
</script>

<template>
  <span class="relative inline-flex">
    <button
      type="button"
      class="inline-flex size-6 cursor-help items-center justify-center rounded-full border border-line bg-transparent text-[10px] text-muted"
      aria-label="Show details for this credibility cue"
      :aria-describedby="show ? tooltipId : undefined"
      @focus="open"
      @blur="scheduleClose"
      @mouseenter="open"
      @mouseleave="scheduleClose"
      @keydown.escape="closeNow"
    >
      ?
    </button>
    <Transition enter-active-class="anim-tooltip-in" leave-active-class="anim-tooltip-out">
      <div
        v-if="show"
        :id="tooltipId"
        role="tooltip"
        class="absolute bottom-[calc(100%+8px)] left-1/2 z-10 w-65 -translate-x-1/2 rounded-md bg-ink p-3 text-xs leading-relaxed text-surface shadow-lg"
        @mouseenter="open"
        @mouseleave="scheduleClose"
      >
        {{ text }}
        <div class="absolute -bottom-1 left-1/2 size-2 -translate-x-1/2 rotate-45 bg-ink" />
      </div>
    </Transition>
  </span>
</template>
