<script setup lang="ts">
withDefaults(
  defineProps<{
    min: number;
    max: number;
    value: number;
    unit?: string;
    disabled?: boolean;
    histogramSeed?: readonly number[];
  }>(),
  {
    unit: "",
    disabled: false,
    histogramSeed: () => [3, 5, 4, 6, 5, 8, 4, 6, 5, 7, 5, 4, 6, 8, 5, 7, 6, 5, 8, 6] as const,
  },
);
</script>

<template>
  <div class="w-full" :data-disabled="disabled || undefined">
    <div class="flex items-baseline justify-between font-mono text-caption">
      <span class="text-foreground">
        {{ value }}<span v-if="unit" class="ml-1.5 text-foreground-subtle">{{ unit }}</span>
      </span>
      <span class="text-foreground-subtle">{{ min }} – {{ max }}</span>
    </div>

    <input
      type="range"
      class="tt-settings-range mt-3 w-full"
      :class="{ 'cursor-not-allowed': disabled }"
      :min="min"
      :max="max"
      :value="value"
      :disabled="disabled"
      :aria-disabled="disabled || undefined"
    />

    <!-- Decorative histogram strip -->
    <div class="mt-3 flex h-6 items-end gap-[3px]" aria-hidden="true">
      <span
        v-for="(bar, index) in histogramSeed"
        :key="index"
        class="block w-[6px] rounded-[1px] bg-success/55"
        :style="{ height: `${(bar / 8) * 100}%` }"
      />
    </div>
  </div>
</template>

<style scoped>
.tt-settings-range {
  appearance: none;
  -webkit-appearance: none;
  background: transparent;
  height: 28px;
}
.tt-settings-range::-webkit-slider-runnable-track {
  height: 1px;
  background: var(--border-strong);
  border-radius: 999px;
}
.tt-settings-range::-moz-range-track {
  height: 1px;
  background: var(--border-strong);
  border-radius: 999px;
}
.tt-settings-range::-webkit-slider-thumb {
  appearance: none;
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 999px;
  background: var(--foreground);
  border: 2px solid var(--background);
  margin-top: -7px;
  box-shadow: var(--shadow-thumb);
}
.tt-settings-range::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 999px;
  background: var(--foreground);
  border: 2px solid var(--background);
  box-shadow: var(--shadow-thumb);
}
.tt-settings-range[data-disabled],
.tt-settings-range:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
</style>
