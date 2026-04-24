<script setup lang="ts">
import type { ProgressEvidenceItem } from '@/features/checks/types'

defineProps<{
  items: readonly ProgressEvidenceItem[]
  waiting: boolean
}>()

function onBeforeEnter(el: Element) {
  const htmlEl = el as HTMLElement
  const index = Number(htmlEl.dataset.index ?? 0)
  htmlEl.style.animationDelay = `${index * 0.1}s`
}
</script>

<template>
  <div>
    <div class="text-body-sm mb-4 font-semibold tracking-[0.06em] text-muted uppercase">
      Evidence found so far &middot; {{ items.length }}
    </div>

    <TransitionGroup name="evidence" tag="div" @before-enter="onBeforeEnter">
      <div
        v-for="(item, index) in items"
        :key="item.sourceName + '-' + index"
        :data-index="index"
        class="mb-0.5 flex"
      >
        <div class="w-[3px] shrink-0 rounded-l-[3px] bg-accent opacity-60" />
        <div class="flex-1 border-b border-line bg-card px-5 py-4 transition-colors duration-400">
          <div class="mb-1 flex items-center justify-between">
            <span class="font-mono text-xs font-medium tracking-[0.03em] text-accent">{{
              item.sourceName
            }}</span>
            <span class="font-mono text-[10px] tracking-[0.03em] text-muted">{{ item.time }}</span>
          </div>
          <div class="mb-1 text-sm leading-snug font-semibold">{{ item.title }}</div>
          <div class="text-body-sm leading-[1.7] text-ink-2">{{ item.snippet }}</div>
        </div>
      </div>
    </TransitionGroup>

    <!-- Waiting indicator -->
    <div
      v-if="waiting"
      class="text-body-sm mt-2 border-t border-dashed border-line p-5 text-center text-muted"
      aria-live="polite"
    >
      <span class="inline-block anim-pulse-dot" aria-hidden="true">&#9679;</span>
      Waiting for more evidence…
    </div>
  </div>
</template>
