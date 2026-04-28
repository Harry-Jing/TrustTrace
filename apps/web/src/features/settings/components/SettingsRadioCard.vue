<script setup lang="ts" generic="T extends string">
import { badgeToneClasses } from "@/components/badgeTone";
import type { BadgeTone } from "@/types/ui";

const props = defineProps<{
  value: T;
  modelValue: T;
  name: string;
  code: string;
  headline: string;
  description: string;
  badge?: { tone: BadgeTone; label: string };
  disabled?: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: T];
}>();

function select() {
  if (props.disabled) return;
  if (props.modelValue !== props.value) {
    emit("update:modelValue", props.value);
  }
}
</script>

<template>
  <label
    class="relative flex flex-1 flex-col gap-3 rounded-md border bg-card p-5 transition-[border-color,background-color,box-shadow,opacity] duration-200"
    :class="[
      modelValue === value
        ? 'border-ink shadow-input-rest'
        : 'border-line hover:border-line-strong',
      disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
    ]"
    :data-selected="modelValue === value"
  >
    <input
      type="radio"
      class="sr-only"
      :name="name"
      :value="value"
      :checked="modelValue === value"
      :disabled="disabled"
      @change="select"
    />
    <div class="flex items-center justify-between gap-3">
      <span class="flex items-center gap-2.5">
        <span
          class="flex size-4 items-center justify-center rounded-full border-[1.5px] transition-colors duration-200"
          :class="modelValue === value ? 'border-ink' : 'border-line-strong'"
          aria-hidden="true"
        >
          <span
            v-if="modelValue === value"
            class="size-2 rounded-full bg-ink transition-transform duration-200"
          />
        </span>
        <span class="font-mono text-[13px] tracking-tight text-ink">{{ code }}</span>
      </span>
      <span
        v-if="badge"
        class="inline-flex items-center rounded-full px-2 py-0.5 font-mono text-eyebrow font-medium uppercase"
        :class="badgeToneClasses(badge.tone)"
      >
        {{ badge.label }}
      </span>
    </div>
    <h3 class="font-serif text-[19px] leading-tight tracking-tight text-ink">
      {{ headline }}
    </h3>
    <p class="text-[13px] leading-[1.6] text-ink-2">
      {{ description }}
    </p>
  </label>
</template>
