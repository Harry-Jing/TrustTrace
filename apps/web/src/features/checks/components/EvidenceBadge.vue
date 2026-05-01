<script setup lang="ts">
import {
  evidenceToneBadgeClasses,
  type EvidenceTone,
} from "@/features/checks/constants/evidenceTone";

const props = defineProps<{
  tone: EvidenceTone;
}>();
</script>

<template>
  <span
    class="duration-tone inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-pill whitespace-nowrap uppercase transition-colors"
    :class="evidenceToneBadgeClasses(props.tone)"
  >
    <slot />
  </span>
</template>
