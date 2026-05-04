<script setup lang="ts" generic="T extends string">
import { RadioGroupRoot } from "reka-ui";

defineProps<{
  modelValue: T;
  name: string;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: T];
}>();
</script>

<template>
  <RadioGroupRoot
    :model-value="modelValue"
    :name="name"
    :disabled="disabled"
    class="grid gap-3 sm:grid-cols-2"
    @update:model-value="(v) => emit('update:modelValue', v as T)"
  >
    <slot />
  </RadioGroupRoot>
</template>
