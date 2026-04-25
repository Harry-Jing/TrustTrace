<script setup lang="ts">
import BaseTagBadge from '@/components/BaseTagBadge.vue'
import type { CheckListItem } from '@/features/checks/types'

defineProps<{
  items: readonly CheckListItem[]
  search: string
}>()

const emit = defineEmits<{
  select: [item: CheckListItem]
}>()

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function toneBorderClass(tone: CheckListItem['tone']) {
  if (tone === 'accent') return 'border-t-accent'
  if (tone === 'warn') return 'border-t-warn'
  if (tone === 'dark') return 'border-t-ink'
  return 'border-t-line-strong'
}

function onBeforeEnter(el: Element) {
  const htmlEl = el as HTMLElement
  const index = Number(htmlEl.dataset.index ?? 0)
  htmlEl.style.animationDelay = `${index * 0.06}s`
}
</script>

<template>
  <TransitionGroup
    name="card"
    tag="div"
    class="relative grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4"
    @before-enter="onBeforeEnter"
  >
    <div v-if="items.length === 0" key="empty" class="col-span-full py-10 text-center text-muted">
      {{
        search
          ? `No checks match "${search}"`
          : 'No checks yet. Run your first credibility check to get started.'
      }}
    </div>

    <button
      v-for="(historyItem, index) in items"
      :key="historyItem.checkId"
      :data-index="index"
      type="button"
      class="group cursor-pointer overflow-hidden rounded-lg border border-t-[3px] border-line bg-card p-0 text-left text-ink transition-[transform,box-shadow,border-color,background-color,color] duration-300 hover:-translate-y-[3px] hover:border-x-line-strong hover:border-b-line-strong hover:shadow-card-hover"
      :class="toneBorderClass(historyItem.tone)"
      @click="emit('select', historyItem)"
    >
      <div class="p-5">
        <div class="mb-2 flex items-center justify-between">
          <span class="font-mono text-[10px] text-muted">{{
            formatDate(historyItem.createdAt)
          }}</span>
        </div>
        <div class="mb-1.5 text-[15px] leading-snug font-semibold">{{ historyItem.claim }}</div>
        <div class="mb-3 text-xs leading-relaxed text-muted">{{ historyItem.snippet }}</div>
        <div class="flex items-center justify-between">
          <BaseTagBadge :tone="historyItem.tone" class="text-[10px]">{{
            historyItem.cue
          }}</BaseTagBadge>
        </div>
      </div>
    </button>
  </TransitionGroup>
</template>
