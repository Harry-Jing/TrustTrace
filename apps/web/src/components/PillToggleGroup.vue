<script setup lang="ts" generic="T extends string">
import { ToggleGroupItem, ToggleGroupRoot } from "reka-ui";
import { computed } from "vue";

type PillToggleSize = "sm" | "md";

const props = withDefaults(
  defineProps<{
    options: readonly { value: T; label: string }[];
    modelValue: T;
    label: string;
    size?: PillToggleSize;
    disabled?: boolean;
  }>(),
  { size: "sm" },
);

const emit = defineEmits<{
  "update:modelValue": [value: T];
}>();

// Two visual presets only — there are exactly two call sites today and the
// classes diverge enough (mono uppercase vs sans caption, ring vs no-ring)
// that exposing them as separate props would over-engineer the abstraction.
// Add a new size when (and only when) a third call site shows up.
const ROOT_CLASSES: Record<PillToggleSize, string> = {
  sm: "ring-1 ring-border-strong ring-inset",
  md: "",
};

const ITEM_CLASSES: Record<PillToggleSize, string> = {
  sm: "px-4 py-2 text-caption font-medium",
  md: "px-5 py-2.5 font-mono text-body-sm font-medium uppercase",
};

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
    class="relative isolate inline-flex overflow-hidden rounded-full bg-surface p-0.75 transition-opacity duration-200 data-[disabled]:opacity-60"
    :class="ROOT_CLASSES[size]"
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
      class="relative z-10 min-w-16 cursor-pointer rounded-full border-none bg-transparent text-foreground-subtle transition-colors duration-200 data-[disabled]:cursor-not-allowed data-[state=on]:text-background"
      :class="ITEM_CLASSES[size]"
    >
      {{ option.label }}
    </ToggleGroupItem>
  </ToggleGroupRoot>
</template>
