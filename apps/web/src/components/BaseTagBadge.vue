<script setup lang="ts">
import { badgeToneClasses } from "@/components/badgeTone";
import type { BadgeTone } from "@/types/ui";

const props = withDefaults(
  defineProps<{
    tone?: BadgeTone;
  }>(),
  { tone: "default" },
);
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-pill uppercase transition-colors duration-tone"
    :class="badgeToneClasses(props.tone)"
  >
    <slot />
  </span>
</template>
