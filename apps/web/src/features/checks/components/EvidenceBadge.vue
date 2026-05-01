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
    class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-pill whitespace-nowrap uppercase transition-colors duration-tone"
    :class="evidenceToneBadgeClasses(props.tone)"
  >
    <slot />
  </span>
</template>
