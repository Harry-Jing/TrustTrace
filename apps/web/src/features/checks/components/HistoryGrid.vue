<script setup lang="ts">
import EvidenceBadge from "@/features/checks/components/EvidenceBadge.vue";
import { evidenceToneBorderTop, evidenceToneFor } from "@/features/checks/constants/evidenceTone";
import type { CheckListItem } from "@/features/checks/types";

defineProps<{
  items: readonly CheckListItem[];
  search: string;
}>();

const emit = defineEmits<{
  select: [item: CheckListItem];
}>();

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function onBeforeEnter(el: Element) {
  const htmlEl = el as HTMLElement;
  const index = Number(htmlEl.dataset.index ?? 0);
  htmlEl.style.animationDelay = `${String(index * 0.06)}s`;
}
</script>

<template>
  <TransitionGroup
    name="card"
    tag="div"
    class="relative grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4"
    @before-enter="onBeforeEnter"
  >
    <div
      v-if="items.length === 0"
      key="empty"
      role="status"
      aria-live="polite"
      class="col-span-full py-10 text-center text-foreground-subtle"
    >
      {{
        search
          ? `No checks match "${search}"`
          : "No checks yet. Run your first credibility check to get started."
      }}
    </div>

    <button
      v-for="(historyItem, index) in items"
      :key="historyItem.checkId"
      :data-index="index"
      type="button"
      class="group cursor-pointer overflow-hidden rounded-lg border border-t-[3px] border-border bg-card p-0 text-left text-foreground transition-[transform,box-shadow,border-color,background-color,color] duration-300 hover:-translate-y-0.75 hover:border-x-border-strong hover:border-b-border-strong hover:shadow-card-hover"
      :class="evidenceToneBorderTop(evidenceToneFor(historyItem.verdictBand))"
      @click="emit('select', historyItem)"
    >
      <div class="p-5">
        <div class="mb-2 flex items-center justify-between">
          <span class="font-mono text-caption text-foreground-subtle">{{
            formatDate(historyItem.createdAt)
          }}</span>
        </div>
        <div class="mb-1.5 text-body font-semibold">{{ historyItem.claim }}</div>
        <div class="mb-3 text-caption text-foreground-subtle">
          {{ historyItem.snippet }}
        </div>
        <div class="flex items-center justify-between">
          <EvidenceBadge :tone="evidenceToneFor(historyItem.verdictBand)" class="text-caption">{{
            historyItem.cue
          }}</EvidenceBadge>
        </div>
      </div>
    </button>
  </TransitionGroup>
</template>
