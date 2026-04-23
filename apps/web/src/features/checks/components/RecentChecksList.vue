<script setup lang="ts">
import TagBadge from '@/components/TagBadge.vue'
import type { RecentCheckItem } from '@/features/checks/types'

defineProps<{
  items: readonly RecentCheckItem[]
}>()

const emit = defineEmits<{
  select: [item: RecentCheckItem]
}>()
</script>

<template>
  <div class="mt-6 stagger-6 text-left">
    <div class="mb-2.5 flex items-center gap-2">
      <span class="font-mono text-[10px] tracking-[0.1em] text-muted uppercase">recent checks</span>
      <div class="h-px flex-1 bg-line" />
    </div>
    <button
      v-for="r in items"
      :key="r.id"
      type="button"
      class="flex w-full items-center gap-3 rounded-md border-none bg-transparent px-3.5 py-2.5 text-left text-ink transition-colors duration-150 hover:bg-surface-alt"
      @click="emit('select', r)"
    >
      <TagBadge :tone="r.tone" class="shrink-0 text-[9px]">{{ r.cue }}</TagBadge>
      <span class="text-body-sm flex-1 truncate font-medium">{{ r.claim }}</span>
      <span class="shrink-0 font-mono text-[10px] text-muted">{{ r.time }}</span>
    </button>
  </div>
</template>
