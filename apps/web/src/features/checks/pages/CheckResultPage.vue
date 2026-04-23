<script setup lang="ts">
import { ref } from 'vue'

import PageFooter from '@/components/PageFooter.vue'
import CredibilityCueList from '@/features/checks/components/CredibilityCueList.vue'
import EvidenceItemsList from '@/features/checks/components/EvidenceItemsList.vue'
import ResultActions from '@/features/checks/components/ResultActions.vue'
import ResultSummary from '@/features/checks/components/ResultSummary.vue'
import UncertaintyPanel from '@/features/checks/components/UncertaintyPanel.vue'
import { useCheckResult } from '@/features/checks/composables/useCheckResult'

const copied = ref(false)
const { checkStatus, result, isLoading, isError, reload } = useCheckResult()

function handleCopy() {
  if (!result.value) return

  void navigator.clipboard
    ?.writeText(result.value.summaryText)
    .then(() => {
      copied.value = true
      setTimeout(() => {
        copied.value = false
      }, 2000)
    })
    .catch(() => {
      // Clipboard write failed (permission denied or unsupported context).
      // Silently degrade — the button stays in its default "Copy summary" state,
      // which is preferable to showing a false "Copied!" confirmation.
    })
}
</script>

<template>
  <div class="mx-auto max-w-[1080px] px-6 pt-12 pb-20">
    <div
      v-if="isLoading || checkStatus === 'queued' || checkStatus === 'running'"
      class="py-20 text-center text-muted"
      aria-live="polite"
    >
      Loading result…
    </div>
    <div v-else-if="isError || !result" class="py-20 text-center">
      <p class="mb-4 text-muted">Could not load the result.</p>
      <button
        class="tt-btn rounded-md border border-line px-4 py-2 text-sm text-ink"
        @click="reload"
      >
        Retry
      </button>
    </div>
    <template v-else>
      <ResultSummary :result="result" />

      <!-- Newspaper two-column -->
      <div
        class="result-newspaper grid stagger-3 grid-cols-1 items-start gap-8 md:grid-cols-[2fr_3fr]"
      >
        <!-- LEFT: Cues + Uncertainty -->
        <div>
          <CredibilityCueList :cues="result.cues" />
          <UncertaintyPanel :lines="result.uncertaintyLines" />
        </div>

        <!-- RIGHT: Evidence items -->
        <EvidenceItemsList :evidence="result.evidence" />
      </div>

      <ResultActions :copied="copied" @copy="handleCopy" />

      <PageFooter>TrustTrace &middot; share context, not conclusions</PageFooter>
    </template>
  </div>
</template>
