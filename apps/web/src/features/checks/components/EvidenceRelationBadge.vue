<script setup lang="ts">
import {
  evidenceRelationToneBadgeClasses,
  type EvidenceRelationTone,
} from "@/features/checks/constants/evidenceRelationTone";

const props = defineProps<{
  tone: EvidenceRelationTone;
}>();
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-mono text-micro font-medium uppercase transition-colors duration-400"
    :class="evidenceRelationToneBadgeClasses(props.tone)"
  >
    <slot />
  </span>
</template>
