<script setup lang="ts">
import { computed, ref, watch } from "vue";

import BaseButton from "@/components/BaseButton.vue";
import PillToggleGroup from "@/components/PillToggleGroup.vue";
import { describeRequestError } from "@/features/checks/constants/apiErrorCopy";
import type { CheckInputDraft, CheckInputMode } from "@/features/checks/types";

const props = defineProps<{
  disabled?: boolean;
  submitting?: boolean;
  error?: unknown;
}>();

const emit = defineEmits<{
  submit: [input: CheckInputDraft];
}>();

const MODE_OPTIONS: readonly { value: CheckInputMode; label: string }[] = [
  { value: "text", label: "text" },
  { value: "url", label: "url" },
];

const mode = ref<CheckInputMode>("text");
const value = ref("");
const inputId = "claim-input";

const normalizedValue = computed(() => value.value.trim());
const charCount = computed(() => value.value.length);
const isDisabled = computed(() => props.disabled || props.submitting);
const errorMessage = computed(() =>
  props.error
    ? describeRequestError(props.error, "Could not start this check. Please try again.")
    : null,
);

function isHttpUrl(input: string) {
  try {
    const url = new URL(input);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

const isValid = computed(() =>
  mode.value === "url"
    ? isHttpUrl(normalizedValue.value)
    : normalizedValue.value.length >= 3 && normalizedValue.value.length <= 10000,
);

watch(mode, () => {
  value.value = "";
});

function submit() {
  if (!isValid.value || isDisabled.value) return;
  emit("submit", { mode: mode.value, value: normalizedValue.value });
}
</script>

<template>
  <!-- Glow the whole card only when the claim field itself has focus.
       Using :has() keeps the trigger scoped to <input>/<textarea>; clicking
       the mode toggle or the submit button no longer lights the border up.
       Falls back gracefully (border stays rest-state) on browsers without
       :has() support — no JS focus tracking needed. -->
  <form
    class="claim-input-card animate-up rounded-lg border-[1.5px] border-border-strong bg-card p-5 text-left shadow-input-rest transition-[border-color,box-shadow,background-color] duration-200 [animation-delay:220ms] sm:p-6"
    @submit.prevent="submit"
  >
    <!-- Mode toggle + char count -->
    <div class="mb-3.5 flex items-center gap-3">
      <PillToggleGroup
        v-model="mode"
        :options="MODE_OPTIONS"
        label="Claim input type"
        size="md"
        :disabled="isDisabled"
      />
      <span class="flex-1" />
      <span
        v-if="mode === 'text'"
        class="font-mono text-label"
        :class="charCount > 10000 ? 'text-warning' : 'text-foreground-subtle'"
      >
        {{ charCount.toLocaleString() }} / 10,000
      </span>
    </div>

    <!-- Input field
         `outline-none` on the input itself is intentional: the parent card
         absorbs focus styling via `:has(.claim-field:focus-visible)` (see
         scoped CSS below). The `claim-field` class is the hook that scopes
         the focus trigger to the actual claim input — clicking the mode
         toggle or submit button does not glow the card. -->
    <label class="sr-only" :for="inputId">Claim to check</label>
    <input
      v-if="mode === 'url'"
      :id="inputId"
      v-model="value"
      type="text"
      placeholder="https://example.com/article-to-check"
      class="claim-field w-full border-none bg-transparent py-2.5 text-body text-foreground outline-none"
      :disabled="isDisabled"
    />
    <textarea
      v-else
      :id="inputId"
      v-model="value"
      placeholder="Paste the claim or excerpt you want to double-check…"
      :rows="3"
      class="claim-field max-h-50 min-h-20 w-full resize-y border-none bg-transparent text-body text-foreground outline-none"
      :disabled="isDisabled"
    />

    <p v-if="errorMessage" class="mt-3 text-caption text-warning" role="alert">
      {{ errorMessage }}
    </p>

    <!-- Submit row -->
    <div class="mt-3.5 flex items-center justify-between border-t border-border pt-3.5">
      <span class="font-mono text-label text-foreground-subtle">
        {{ mode === "url" ? "paste a full http(s) URL" : "min 3 characters" }}
      </span>
      <BaseButton type="submit" variant="accent" size="lg" :disabled="!isValid || isDisabled">
        {{ submitting ? "Starting…" : "Run credibility check" }}
      </BaseButton>
    </div>
  </form>
</template>

<style scoped>
/* Card glow is scoped to `.claim-field` — the actual input/textarea.
   Clicks on the mode toggle, character counter, or submit button no
   longer trigger the card border (the previous @focusin/@focusout JS
   pattern lit up for any descendant focus, including the mode toggle).
   Plain :focus is intentional so mouse focus still glows the card,
   matching the prior interaction model. */
.claim-input-card:has(.claim-field:focus) {
  border-color: var(--accent);
  box-shadow: var(--shadow-input-focus);
}
</style>
