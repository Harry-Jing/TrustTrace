<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import PageFooter from '@/components/PageFooter.vue'
import TagBadge from '@/components/TagBadge.vue'
import { getCheck } from '@/features/checks/api/checksApi'
import type { CheckApiError } from '@/features/checks/types'
import { useAsyncData } from '@/shared/composables/useAsyncData'

const route = useRoute()
const router = useRouter()
const showDetail = ref(false)
const detailId = 'error-detail'

const checkId = computed(() => String(route.params.checkId ?? ''))

const { data: record } = useAsyncData(() => getCheck(checkId.value))

const error = computed<CheckApiError | null>(() => record.value?.error ?? null)
const errorCode = computed(() => error.value?.code ?? 'UNKNOWN_ERROR')
const errorCategory = computed(() => error.value?.category ?? 'unknown error')
const errorMessage = computed(
  () => error.value?.message ?? 'Something went wrong. You can retry with the same claim.',
)
const traceId = computed(() => error.value?.traceId ?? null)
const isRetryable = computed(() => error.value?.retryable ?? true)

const ERROR_EXPLANATIONS: Record<string, string> = {
  PROVIDER_TIMEOUT:
    'The AI provider (e.g. OpenAI) didn’t respond in time. This usually happens during high traffic. Your claim was received but analysis couldn’t complete.',
  RATE_LIMITED:
    'Too many requests were sent in a short period. The provider enforces rate limits to ensure fair usage. Waiting a moment before retrying usually resolves this.',
  PROVIDER_ERROR:
    'The AI provider returned an unexpected error. This is typically a temporary issue on their end.',
}

const errorExplanation = computed(
  () =>
    ERROR_EXPLANATIONS[errorCode.value] ??
    'An unexpected error occurred while processing your check. If this keeps happening, the service may be experiencing issues.',
)
</script>

<template>
  <div class="mx-auto max-w-[520px] px-6 pt-25 pb-20 text-center">
    <div class="anim-up">
      <!-- SVG illustration -->
      <svg
        width="72"
        height="72"
        viewBox="0 0 72 72"
        fill="none"
        class="mx-auto mb-5 block"
        aria-hidden="true"
      >
        <circle
          cx="36"
          cy="36"
          r="30"
          class="stroke-line-strong"
          stroke-width="2"
          stroke-dasharray="8 6"
          opacity=".6"
        />
        <circle
          cx="36"
          cy="36"
          r="30"
          class="stroke-warn"
          stroke-width="2.5"
          stroke-dasharray="40 200"
          stroke-linecap="round"
        />
        <path d="M36 24v16" class="stroke-warn" stroke-width="2.5" stroke-linecap="round" />
        <circle cx="36" cy="46" r="1.5" class="fill-warn" />
      </svg>

      <TagBadge tone="warn">{{ errorCategory }}</TagBadge>

      <h2 class="mx-auto mt-5 mb-2.5 font-serif text-[28px] tracking-tight">
        {{ errorMessage }}
      </h2>

      <p class="mx-auto mb-7 max-w-[400px] text-sm leading-[1.75] text-muted">
        {{
          isRetryable
            ? 'You can retry with the same claim.'
            : 'Please try again with a different claim.'
        }}
      </p>

      <div class="flex justify-center gap-2.5">
        <button
          v-if="isRetryable"
          class="tt-btn rounded-md border-none bg-ink px-7 py-[11px] text-sm font-semibold text-surface"
          @click="router.push({ name: 'loading', params: { checkId } })"
        >
          Retry check
        </button>
        <button
          class="tt-btn rounded-md border border-line-strong bg-transparent px-5 py-[11px] text-sm text-ink-2"
          @click="router.push({ name: 'landing' })"
        >
          Edit claim
        </button>
      </div>

      <div v-if="traceId" class="mt-7">
        <span class="font-mono text-[10px] tracking-[0.06em] text-muted"
          >trace · {{ traceId }}</span
        >
      </div>

      <!-- Expandable explanation -->
      <div class="mx-auto mt-6 max-w-[400px] text-left">
        <button
          class="flex items-center gap-1.5 border-none bg-transparent p-0 font-mono text-xs text-muted"
          :aria-controls="detailId"
          :aria-expanded="showDetail"
          @click="showDetail = !showDetail"
        >
          <span
            class="text-[10px] transition-transform duration-200"
            :class="showDetail ? 'rotate-90' : ''"
          >
            &#9654;
          </span>
          What does this error mean?
        </button>

        <div class="expand-panel" :data-open="showDetail">
          <div class="expand-panel__inner">
            <div
              :id="detailId"
              class="text-body-sm mt-2.5 rounded-md border border-line bg-surface-alt p-3.5 text-left leading-[1.7] text-ink-2"
            >
              <p class="mb-2">
                <strong>{{ errorCode }}</strong> — {{ errorExplanation }}
              </p>
              <p class="m-0 text-muted">
                {{
                  isRetryable
                    ? 'Wait a moment and retry. If this keeps happening, the provider may be experiencing an outage.'
                    : 'If this keeps happening, please contact support.'
                }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <PageFooter>TrustTrace &middot; evidence-first credibility</PageFooter>
  </div>
</template>
