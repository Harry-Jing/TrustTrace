<script setup lang="ts">
import BaseComingSoonPill from "@/components/BaseComingSoonPill.vue";

withDefaults(
  defineProps<{
    label?: string;
    helper?: string;
    comingSoon?: boolean;
    isLast?: boolean;
    layout?: "split" | "stack";
  }>(),
  { label: "", helper: "", layout: "split" },
);
</script>

<template>
  <div class="py-5" :class="{ 'border-b border-border': !isLast }" :data-layout="layout">
    <div
      v-if="layout === 'split'"
      class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-6"
    >
      <div v-if="label || helper || $slots.label" class="md:flex-1">
        <div class="flex items-center gap-2">
          <span v-if="label" class="text-body-sm font-medium text-foreground">{{ label }}</span>
          <slot name="label" />
          <BaseComingSoonPill v-if="comingSoon" />
        </div>
        <p v-if="helper" class="mt-1 text-body-sm text-foreground-subtle">{{ helper }}</p>
        <slot name="helper" />
      </div>
      <div class="md:flex-shrink-0">
        <slot />
      </div>
    </div>

    <div v-else class="flex flex-col gap-4">
      <div v-if="label || helper || $slots.label">
        <div class="flex items-center gap-2">
          <span v-if="label" class="text-body-sm font-medium text-foreground">{{ label }}</span>
          <slot name="label" />
          <BaseComingSoonPill v-if="comingSoon" />
        </div>
        <p v-if="helper" class="mt-1 text-body-sm text-foreground-subtle">{{ helper }}</p>
        <slot name="helper" />
      </div>
      <slot />
    </div>
  </div>
</template>
