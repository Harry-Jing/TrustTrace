<script setup lang="ts">
import { SwitchRoot, SwitchThumb } from "reka-ui";

defineProps<{
  modelValue: boolean;
  label: string;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();
</script>

<template>
  <SwitchRoot
    :model-value="modelValue"
    :disabled="disabled"
    :aria-label="label"
    class="inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border p-[2px] transition-colors duration-200 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-60 data-[state=checked]:border-ink data-[state=checked]:bg-ink data-[state=unchecked]:border-line-strong data-[state=unchecked]:bg-surface-alt"
    @update:model-value="(v: boolean) => emit('update:modelValue', v)"
  >
    <SwitchThumb
      class="pointer-events-none block size-[18px] rounded-full bg-card shadow-[0_1px_2px_rgba(0,0,0,0.28),0_0_0_1px_rgba(0,0,0,0.08)] transition-transform duration-200 ease-snappy data-[state=checked]:translate-x-[20px] data-[state=unchecked]:translate-x-0"
    />
  </SwitchRoot>
</template>
