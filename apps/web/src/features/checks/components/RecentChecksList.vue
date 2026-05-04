<script setup lang="ts">
import EvidenceBadge from "@/features/checks/components/EvidenceBadge.vue";
import { evidenceToneFor } from "@/features/checks/constants/evidenceTone";
import type { CheckListItem } from "@/features/checks/types";

defineProps<{
  items: readonly CheckListItem[];
}>();

const emit = defineEmits<{
  select: [item: CheckListItem];
}>();

function formatRelativeTime(iso: string) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${String(minutes)} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${String(hours)} hr ago`;
  const days = Math.floor(hours / 24);
  return `${String(days)}d ago`;
}
</script>

<template>
  <div class="mt-6 animate-up text-left [animation-delay:380ms]">
    <div class="mb-2.5 flex items-center gap-2">
      <span class="font-mono text-eyebrow text-foreground-subtle uppercase">recent checks</span>
      <div class="h-px flex-1 bg-border" />
    </div>
    <button
      v-for="recentCheck in items"
      :key="recentCheck.checkId"
      type="button"
      class="flex w-full flex-col gap-1.5 rounded-md border-none bg-transparent px-3.5 py-2.5 text-left text-foreground transition-colors duration-150 hover:bg-surface md:flex-row md:items-center md:gap-3"
      @click="emit('select', recentCheck)"
    >
      <div class="flex items-center justify-between md:contents">
        <div class="shrink-0 md:w-36">
          <EvidenceBadge :tone="evidenceToneFor(recentCheck.verdictBand)" class="text-caption">{{
            recentCheck.cue
          }}</EvidenceBadge>
        </div>
        <span class="shrink-0 font-mono text-caption text-foreground-subtle md:order-last">{{
          formatRelativeTime(recentCheck.createdAt)
        }}</span>
      </div>
      <span class="text-label md:order-2 md:flex-1 md:truncate">{{ recentCheck.claim }}</span>
    </button>
  </div>
</template>
