<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean;
  label: string;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

function toggle() {
  if (props.disabled) return;
  emit("update:modelValue", !props.modelValue);
}
</script>

<template>
  <button
    type="button"
    role="switch"
    :aria-checked="modelValue"
    :aria-label="label"
    :disabled="disabled"
    class="inline-flex h-6 w-11 shrink-0 items-center rounded-full border p-[2px] transition-colors duration-200"
    :class="[
      modelValue ? 'border-ink bg-ink' : 'border-line-strong bg-surface-alt',
      disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
    ]"
    @click="toggle"
  >
    <span
      class="pointer-events-none block size-[18px] rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.25),0_0_0_0.5px_rgba(0,0,0,0.06)] transition-transform duration-200 ease-snappy"
      :style="{ transform: modelValue ? 'translateX(20px)' : 'translateX(0)' }"
      aria-hidden="true"
    />
  </button>
</template>
