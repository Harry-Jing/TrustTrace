<script setup lang="ts" generic="T extends string">
import { RadioGroupIndicator, RadioGroupItem } from "reka-ui";

import { badgeToneClasses } from "@/components/badgeTone";
import type { BadgeTone } from "@/types/ui";

defineProps<{
  value: T;
  code: string;
  headline: string;
  description: string;
  badge?: { tone: BadgeTone; label: string };
  disabled?: boolean;
}>();
</script>

<template>
  <RadioGroupItem
    :value="value"
    :disabled="disabled"
    class="group relative flex flex-1 cursor-pointer flex-col gap-3 rounded-lg border border-border bg-card p-5 text-left transition-[border-color,background-color,box-shadow,opacity] duration-200 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-60 data-[state=checked]:border-foreground data-[state=checked]:shadow-input-rest enabled:data-[state=unchecked]:hover:border-border-strong"
  >
    <div class="flex items-center justify-between gap-3">
      <span class="flex items-center gap-2.5">
        <span
          class="flex size-4 items-center justify-center rounded-full border-[1.5px] border-border-strong transition-colors duration-200 group-data-[state=checked]:border-foreground"
          aria-hidden="true"
        >
          <RadioGroupIndicator
            class="block size-2 rounded-full bg-foreground transition-transform duration-200"
          />
        </span>
        <span class="font-mono text-body-sm text-foreground">{{ code }}</span>
      </span>
      <span
        v-if="badge"
        class="inline-flex items-center rounded-full px-2 py-0.5 font-mono text-eyebrow uppercase"
        :class="badgeToneClasses(badge.tone)"
      >
        {{ badge.label }}
      </span>
    </div>
    <h3 class="font-serif text-h4 text-foreground">
      {{ headline }}
    </h3>
    <p class="text-body-sm text-foreground-muted">
      {{ description }}
    </p>
  </RadioGroupItem>
</template>
