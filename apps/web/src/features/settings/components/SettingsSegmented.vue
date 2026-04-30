<script setup lang="ts" generic="T extends string">
import { ToggleGroupItem, ToggleGroupRoot } from "reka-ui";
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

function handleUpdate(value: unknown) {
  if (typeof value !== "string") return;
  const match = props.options.find((option) => option.value === value);
  if (match && match.value !== props.modelValue) {
    emit("update:modelValue", match.value);
  }
}
</script>

<template>
  <ToggleGroupRoot
    type="single"
    :model-value="modelValue"
    :disabled="disabled"
    :aria-label="label"
    class="relative isolate inline-flex overflow-hidden rounded-full bg-surface p-0.75 ring-1 ring-border-strong transition-opacity duration-200 ring-inset data-[disabled]:opacity-60"
    @update:model-value="handleUpdate"
  >
    <div
      v-if="activeIndex >= 0"
      class="pointer-events-none absolute top-0.75 z-0 h-[calc(100%-6px)] rounded-full bg-foreground transition-[left,width] duration-250 ease-snappy"
      :style="{
        left: `calc(${activeIndex * (100 / options.length)}% + 3px)`,
        width: `calc(${100 / options.length}% - 6px)`,
      }"
      aria-hidden="true"
    />
    <ToggleGroupItem
      v-for="option in options"
      :key="option.value"
      :value="option.value"
      :disabled="disabled"
      class="relative z-10 min-w-16 cursor-pointer rounded-full border-none bg-transparent px-4 py-2 text-caption font-medium text-foreground-subtle transition-colors duration-200 data-[disabled]:cursor-not-allowed data-[state=on]:text-background"
    >
      {{ option.label }}
    </ToggleGroupItem>
  </ToggleGroupRoot>
</template>
