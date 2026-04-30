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
// near-black in dark. Required because dark-mode --accent is amber, where
// pure white fails WCAG AA contrast.
const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "border border-foreground bg-foreground text-background",
  accent: "border border-accent bg-accent text-card",
  secondary: "border border-border-strong bg-transparent text-foreground",
  subtle: "border border-border bg-transparent text-foreground-muted",
};

// Heights are explicit `h-X` tokens (not derived from `padding × text-size`).
// This pins each size to a known value regardless of font-metric drift, and
// matches what shadcn / Radix / GitHub Primer all do — the design system
// owns the height, content owns the width. lg = h-11 (44px) hits Apple HIG
// + WCAG AAA touch target exactly; md = h-10 (40px) carries the secondary-
// action visual weight without competing with lg; sm = h-8 (32px) is the
// floor for a still-tappable button on the 4pt grid. Horizontal padding
// follows the same scale (px-3/4/6) — px-7 is dropped (the same non-standard
// value AppNav just shed) and the prior `py-2.75` quarter-step (a fragile
// way of approximating 44px) is gone in favor of the explicit height token.
const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "h-8 rounded-md px-3 text-caption",
  md: "h-10 rounded-md px-4 text-body-sm font-semibold",
  lg: "h-11 rounded-md px-6 text-body-sm font-semibold",
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
