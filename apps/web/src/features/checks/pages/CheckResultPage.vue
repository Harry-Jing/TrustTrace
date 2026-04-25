<script setup lang="ts">
import { ref } from 'vue'

import BasePageFooter from '@/components/BasePageFooter.vue'
import AtAGlanceStats from '@/features/checks/components/AtAGlanceStats.vue'
import CredibilityCueList from '@/features/checks/components/CredibilityCueList.vue'
import EvidenceLadder from '@/features/checks/components/EvidenceLadder.vue'
import ResultActions from '@/features/checks/components/ResultActions.vue'
import ResultHeader from '@/features/checks/components/ResultHeader.vue'
import ResultNoteCallout from '@/features/checks/components/ResultNoteCallout.vue'
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
  <div class="mx-auto max-w-[1140px] px-6 pt-12 pb-20">
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
      <ResultHeader :result="result" />

      <div class="mt-10 grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <!-- LEFT: 4-tier evidence ladder -->
        <EvidenceLadder :evidence="result.evidence" />

        <!-- RIGHT: sidebar -->
        <aside class="space-y-7 lg:sticky lg:top-20">
          <div class="rounded-lg border border-line bg-card p-5">
            <AtAGlanceStats :glance="result.atAGlance" />
          </div>

          <div class="rounded-lg border border-line bg-card p-5">
            <CredibilityCueList :cues="result.cues" />
          </div>

          <div class="rounded-lg border border-line bg-card p-5">
            <UncertaintyPanel :lines="result.uncertaintyLines" />
          </div>

          <ResultNoteCallout :text="result.noteText" />
        </aside>
      </div>

      <ResultActions :copied="copied" @copy="handleCopy" />

      <BasePageFooter>TrustTrace &middot; share context, not conclusions</BasePageFooter>
    </template>
  </div>
</template>
