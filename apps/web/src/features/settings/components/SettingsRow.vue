<script setup lang="ts">
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
  <div class="py-5" :class="{ 'border-b border-line': !isLast }" :data-layout="layout">
    <div
      v-if="layout === 'split'"
      class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-6"
    >
      <div v-if="label || helper || $slots.label" class="md:flex-1">
        <div class="flex items-center gap-2">
          <span v-if="label" class="text-sm font-medium text-ink">{{ label }}</span>
          <slot name="label" />
          <span
            v-if="comingSoon"
            class="inline-flex items-center rounded-full border border-line bg-surface-alt px-2 py-0.5 font-mono text-[10px] font-medium tracking-[0.06em] text-muted uppercase"
          >
            coming soon
          </span>
        </div>
        <p v-if="helper" class="mt-1 text-[13px] leading-relaxed text-muted">{{ helper }}</p>
        <slot name="helper" />
      </div>
      <div class="md:flex-shrink-0">
        <slot />
      </div>
    </div>

    <div v-else class="flex flex-col gap-4">
      <div v-if="label || helper || $slots.label">
        <div class="flex items-center gap-2">
          <span v-if="label" class="text-sm font-medium text-ink">{{ label }}</span>
          <slot name="label" />
          <span
            v-if="comingSoon"
            class="inline-flex items-center rounded-full border border-line bg-surface-alt px-2 py-0.5 font-mono text-[10px] font-medium tracking-[0.06em] text-muted uppercase"
          >
            coming soon
          </span>
        </div>
        <p v-if="helper" class="mt-1 text-[13px] leading-relaxed text-muted">{{ helper }}</p>
        <slot name="helper" />
      </div>
      <slot />
    </div>
  </div>
</template>
