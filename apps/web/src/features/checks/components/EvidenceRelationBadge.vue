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
    class="duration-tone inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-mono text-pill uppercase transition-colors"
    :class="evidenceRelationToneBadgeClasses(props.tone)"
  >
    <slot />
  </span>
</template>
