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
    class="relative inline-flex h-7 w-12 items-center rounded-full border border-line transition-colors duration-200"
    :class="[
      modelValue ? 'bg-ink' : 'bg-surface-alt',
      disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
    ]"
    @click="toggle"
  >
    <span
      class="pointer-events-none absolute top-1/2 size-5 -translate-y-1/2 rounded-full bg-card shadow-[0_1px_2px_rgba(0,0,0,0.18)] transition-transform duration-200 ease-snappy"
      :style="{ transform: modelValue ? 'translate(20px, -50%)' : 'translate(2px, -50%)' }"
      aria-hidden="true"
    />
  </button>
</template>
