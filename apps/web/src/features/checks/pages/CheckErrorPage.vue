<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute } from "vue-router";

import BaseButton from "@/components/BaseButton.vue";
import BasePageFooter from "@/components/BasePageFooter.vue";
import BaseTagBadge from "@/components/BaseTagBadge.vue";
import BaseWarnRingIllustration from "@/components/BaseWarnRingIllustration.vue";
import { getCheck } from "@/features/checks/api/checksApi";
import { useCreateCheck } from "@/features/checks/composables/useCreateCheck";
import { useChecksStore } from "@/features/checks/stores/checks.store";
import type { CheckApiError } from "@/features/checks/types";
import { useAsyncData } from "@/shared/composables/useAsyncData";

const route = useRoute();
const showDetail = ref(false);
const checks = useChecksStore();
const { createCheck, isSubmitting, submitError } = useCreateCheck();
const detailId = "error-detail";

const checkId = computed(() => String(route.params.checkId ?? ""));

const { data: record } = useAsyncData(() => getCheck(checkId.value));

const error = computed<CheckApiError | null>(() => record.value?.error ?? null);
const errorCode = computed(() => error.value?.code ?? "UNKNOWN_ERROR");
const errorCategory = computed(() => error.value?.category ?? "unknown error");
const errorMessage = computed(
  () => error.value?.message ?? "Something went wrong. You can retry with the same claim.",
);
const traceId = computed(() => error.value?.traceId ?? null);
const isRetryable = computed(() => error.value?.retryable ?? true);
const retryInput = computed(() => record.value?.input ?? checks.currentInput);
const canRetry = computed(() => isRetryable.value && retryInput.value !== null);
const retryHelp = computed(() => {
  if (canRetry.value) return "You can retry with the same claim.";
  if (isRetryable.value) return "Return to the claim editor to start a new check.";
  return "Please try again with a different claim.";
});
const retryErrorMessage = computed(() => {
  if (!submitError.value) return null;
  if (submitError.value instanceof Error) return submitError.value.message;
  return "Could not retry this check. Please edit the claim and try again.";
});

const ERROR_EXPLANATIONS: Record<string, string> = {
  PROVIDER_TIMEOUT:
    "The AI provider (e.g. OpenAI) didn’t respond in time. This usually happens during high traffic. Your claim was received but analysis couldn’t complete.",
  RATE_LIMITED:
    "Too many requests were sent in a short period. The provider enforces rate limits to ensure fair usage. Waiting a moment before retrying usually resolves this.",
  PROVIDER_ERROR:
    "The AI provider returned an unexpected error. This is typically a temporary issue on their end.",
};

const errorExplanation = computed(
  () =>
    ERROR_EXPLANATIONS[errorCode.value] ??
    "An unexpected error occurred while processing your check. If this keeps happening, the service may be experiencing issues.",
);

async function retryCheck() {
  if (!retryInput.value) return;

  try {
    await createCheck(retryInput.value);
  } catch {
    // useCreateCheck exposes submitError for this page.
  }
}
</script>

<template>
  <div class="mx-auto max-w-alert px-6 pt-25 pb-20 text-center">
    <div class="anim-up">
      <BaseWarnRingIllustration />

      <BaseTagBadge tone="warn">{{ errorCategory }}</BaseTagBadge>

      <h1 class="mx-auto mt-5 mb-2.5 font-serif text-[28px] tracking-tight">
        {{ errorMessage }}
      </h1>

      <p class="mx-auto mb-7 max-w-100 text-sm leading-[1.75] text-muted">
        {{ retryHelp }}
      </p>

      <div class="flex justify-center gap-2.5">
        <BaseButton
          v-if="canRetry"
          variant="primary"
          size="lg"
          :disabled="isSubmitting"
          @click="retryCheck"
        >
          {{ isSubmitting ? "Retrying…" : "Retry check" }}
        </BaseButton>
        <BaseButton variant="secondary" size="lg" :to="{ name: 'landing' }">
          Edit claim
        </BaseButton>
      </div>

      <p v-if="retryErrorMessage" class="mt-5 text-xs leading-relaxed text-warn" role="alert">
        {{ retryErrorMessage }}
      </p>

      <div v-if="traceId" class="mt-7">
        <span class="font-mono text-[10px] tracking-[0.06em] text-muted"
          >trace · {{ traceId }}</span
        >
      </div>

      <!-- Expandable explanation -->
      <div class="mx-auto mt-6 max-w-100 text-left">
        <button
          type="button"
          class="flex items-center gap-1.5 border-none bg-transparent p-0 font-mono text-xs text-muted"
          :aria-controls="detailId"
          :aria-expanded="showDetail"
          @click="showDetail = !showDetail"
        >
          <svg
            class="size-2.5 transition-transform duration-200"
            :class="showDetail ? 'rotate-90' : ''"
            viewBox="0 0 8 8"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M1.5 0.5l5 3.5-5 3.5z" />
          </svg>
          What does this error mean?
        </button>

        <div class="expand-panel" :data-open="showDetail">
          <div class="expand-panel-inner">
            <div
              :id="detailId"
              class="mt-2.5 rounded-lg border border-line bg-surface-alt p-3.5 text-left text-body-sm leading-[1.7] text-ink-2"
            >
              <p class="mb-2">
                <strong>{{ errorCode }}</strong> — {{ errorExplanation }}
              </p>
              <p class="m-0 text-muted">
                {{
                  isRetryable
                    ? "Wait a moment and retry. If this keeps happening, the provider may be experiencing an outage."
                    : "If this keeps happening, please contact support."
                }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <BasePageFooter>TrustTrace &middot; evidence-first credibility</BasePageFooter>
  </div>
</template>
