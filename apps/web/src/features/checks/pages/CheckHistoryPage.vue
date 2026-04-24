<script setup lang="ts">
import { useRouter } from 'vue-router'

import PageFooter from '@/components/PageFooter.vue'
import HistoryGrid from '@/features/checks/components/HistoryGrid.vue'
import HistoryToolbar from '@/features/checks/components/HistoryToolbar.vue'
import { useCheckHistory } from '@/features/checks/composables/useCheckHistory'
import type { CheckListItem } from '@/features/checks/types'

const router = useRouter()
const { search, sortBy, items, isLoading, isError, reload } = useCheckHistory()

function selectHistoryItem(item: CheckListItem) {
  void router.push(`/checks/${item.id}/result`)
}
</script>

<template>
  <div class="mx-auto max-w-[1080px] px-6 pt-12 pb-20">
    <div class="mb-6 flex stagger-1 flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 class="mt-2.5 mb-1.5 font-serif text-4xl tracking-tight">Your checks</h1>
        <p class="text-sm leading-[1.7] text-muted">
          Your recent credibility checks. Select one to revisit the evidence and cues.
        </p>
      </div>
      <HistoryToolbar v-model:search="search" v-model:sort-by="sortBy" class="shrink-0" />
    </div>

    <div v-if="isLoading" class="py-10 text-center text-muted" aria-live="polite">
      Loading history…
    </div>
    <div v-else-if="isError" class="py-10 text-center">
      <p class="mb-4 text-muted">Could not load history.</p>
      <button
        class="tt-btn rounded-md border border-line px-4 py-2 text-sm text-ink"
        @click="reload"
      >
        Retry
      </button>
    </div>
    <HistoryGrid v-else :items="items" :search="search" @select="selectHistoryItem" />

    <PageFooter v-if="!isLoading && !isError">{{ items.length }} checks total</PageFooter>
  </div>
</template>
