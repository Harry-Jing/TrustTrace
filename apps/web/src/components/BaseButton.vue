<script setup lang="ts">
import { computed } from "vue";
import { RouterLink, type RouteLocationRaw } from "vue-router";

type ButtonVariant = "primary" | "accent" | "secondary" | "subtle";
type ButtonSize = "sm" | "md" | "lg";

const props = withDefaults(
  defineProps<{
    variant?: ButtonVariant;
    size?: ButtonSize;
    type?: "button" | "submit" | "reset";
    disabled?: boolean;
    to?: RouteLocationRaw | null;
  }>(),
  {
    variant: "primary",
    size: "md",
    type: "button",
    disabled: false,
    to: null,
  },
);

// `text-card` (not `text-white`) flips with the theme: white in light mode,
// near-black in dark. Required because dark-mode --tt-accent is amber, where
// pure white fails WCAG AA contrast.
const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "border border-ink bg-ink text-surface",
  accent: "border border-accent bg-accent text-card",
  secondary: "border border-line-strong bg-transparent text-ink",
  subtle: "border border-line bg-transparent text-ink-2",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "rounded-md px-3 py-1.5 text-xs",
  md: "rounded-md px-4 py-2.5 text-body-sm font-semibold",
  lg: "rounded-md px-7 py-2.75 text-sm font-semibold",
};

const variantClass = computed(() => VARIANT_CLASSES[props.variant]);
const sizeClass = computed(() => SIZE_CLASSES[props.size]);
const renderAsLink = computed(() => props.to !== null && !props.disabled);
</script>

<template>
  <RouterLink
    v-if="renderAsLink"
    :to="to!"
    class="tt-btn inline-flex items-center justify-center gap-1.5 transition-colors duration-200"
    :class="[variantClass, sizeClass]"
  >
    <slot />
  </RouterLink>
  <button
    v-else
    :type="type"
    :disabled="disabled"
    class="tt-btn inline-flex items-center justify-center gap-1.5 transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60"
    :class="[variantClass, sizeClass]"
  >
    <slot />
  </button>
</template>
