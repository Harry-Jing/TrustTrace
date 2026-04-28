<script setup lang="ts" generic="T extends string">
import { computed } from "vue";

const props = defineProps<{
  options: readonly { value: T; label: string }[];
  modelValue: T;
  label: string;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: T];
}>();

const activeIndex = computed(() =>
  props.options.findIndex((option) => option.value === props.modelValue),
);

function select(value: T) {
  if (props.disabled) return;
  if (value !== props.modelValue) {
    emit("update:modelValue", value);
  }
}
</script>

<template>
  <div
    class="relative isolate inline-flex overflow-hidden rounded-full bg-surface-alt p-0.75"
    role="group"
    :aria-label="label"
    :data-disabled="disabled || undefined"
  >
    <div
      v-if="activeIndex >= 0"
      class="pointer-events-none absolute top-0.75 z-0 h-[calc(100%-6px)] rounded-full bg-ink transition-[left,width] duration-250 ease-snappy"
      :style="{
        left: `calc(${activeIndex * (100 / options.length)}% + 3px)`,
        width: `calc(${100 / options.length}% - 6px)`,
      }"
    />
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      class="relative z-10 min-w-16 rounded-full border-none bg-transparent px-4 py-2 text-[12px] font-medium tracking-tight transition-colors duration-200 aria-pressed:text-surface"
      :class="[
        modelValue === option.value ? 'text-surface' : 'text-muted',
        disabled ? 'cursor-not-allowed' : 'cursor-pointer',
      ]"
      :aria-pressed="modelValue === option.value"
      :disabled="disabled"
      @click="select(option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>
