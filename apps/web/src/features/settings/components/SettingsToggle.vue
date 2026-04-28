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
    class="relative inline-flex h-[26px] w-[46px] items-center rounded-full border transition-colors duration-200"
    :class="[
      modelValue ? 'border-ink bg-ink' : 'border-line-strong bg-surface-alt',
      disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
    ]"
    @click="toggle"
  >
    <span
      class="pointer-events-none absolute top-1/2 size-[18px] -translate-y-1/2 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.22),0_0_0_0.5px_rgba(0,0,0,0.04)] transition-transform duration-200 ease-snappy"
      :style="{ transform: modelValue ? 'translate(23px, -50%)' : 'translate(3px, -50%)' }"
      aria-hidden="true"
    />
  </button>
</template>
