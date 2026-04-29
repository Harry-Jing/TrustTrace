<script setup lang="ts">
import { useRouter } from "vue-router";

import BaseButton from "@/components/BaseButton.vue";
import BasePageFooter from "@/components/BasePageFooter.vue";
import HistoryGrid from "@/features/checks/components/HistoryGrid.vue";
import HistoryToolbar from "@/features/checks/components/HistoryToolbar.vue";
import { useCheckHistory } from "@/features/checks/composables/useCheckHistory";
import type { CheckListItem } from "@/features/checks/types";

const router = useRouter();
const { search, sortBy, items, isLoading, isError, reload } = useCheckHistory();

function selectHistoryItem(historyItem: CheckListItem) {
  void router.push(`/checks/${historyItem.checkId}/result`);
}
</script>

<template>
  <div class="mx-auto max-w-page px-6 pt-12 pb-20">
    <div
      class="mb-6 flex animate-up flex-col gap-4 [animation-delay:50ms] md:flex-row md:items-end md:justify-between"
    >
      <div>
        <h1 class="mt-2.5 mb-1.5 font-serif text-display-md">Your checks</h1>
        <p class="text-sm leading-[1.7] text-foreground-subtle">
          Your recent credibility checks. Select one to revisit the evidence and cues.
        </p>
      </div>
      <HistoryToolbar v-model:search="search" v-model:sort-by="sortBy" class="shrink-0" />
    </div>

    <div v-if="isLoading" class="py-10 text-center text-foreground-subtle" aria-live="polite">
      Loading history…
    </div>
    <div v-else-if="isError" class="py-10 text-center">
      <p class="mb-4 text-foreground-subtle">Could not load history.</p>
      <BaseButton variant="subtle" @click="reload">Retry</BaseButton>
    </div>
    <HistoryGrid v-else :items="items" :search="search" @select="selectHistoryItem" />

    <BasePageFooter v-if="!isLoading && !isError">{{ items.length }} checks total</BasePageFooter>
  </div>
</template>
