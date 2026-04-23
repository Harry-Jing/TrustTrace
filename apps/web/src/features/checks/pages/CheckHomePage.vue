<script setup lang="ts">
import { useRouter } from 'vue-router'

import PageFooter from '@/components/PageFooter.vue'
import ClaimInputCard from '@/features/checks/components/ClaimInputCard.vue'
import HowItWorksPanel from '@/features/checks/components/HowItWorksPanel.vue'
import LandingInfoColumns from '@/features/checks/components/LandingInfoColumns.vue'
import RecentChecksList from '@/features/checks/components/RecentChecksList.vue'
import { useCreateCheck } from '@/features/checks/composables/useCreateCheck'
import { useRecentChecks } from '@/features/checks/composables/useRecentChecks'
import type { CheckInputDraft, RecentCheckItem } from '@/features/checks/types'

const router = useRouter()
const { createCheck, isSubmitting, submitError } = useCreateCheck()
const { recentChecks } = useRecentChecks()

async function submit(input: CheckInputDraft) {
  try {
    await createCheck(input)
  } catch {
    // useCreateCheck exposes submitError for the input card.
  }
}

function selectRecentCheck(item: RecentCheckItem) {
  void router.push({ name: 'result', params: { checkId: item.id } })
}
</script>

<template>
  <div class="mx-auto max-w-[1080px] px-6 pt-18 pb-15">
    <!-- Hero: stacked on mobile, side-by-side on desktop -->
    <div
      class="flex flex-col items-center text-center lg:flex-row lg:items-center lg:gap-16 lg:text-left"
    >
      <!-- Left: copy -->
      <div class="lg:flex-1">
        <div class="stagger-1">
          <span class="font-mono text-[11px] font-medium tracking-[0.12em] text-accent uppercase">
            before you pass it on
          </span>
        </div>

        <h1
          class="mt-4 mb-5 stagger-2 font-serif text-[clamp(34px,5.5vw,48px)] leading-[1.12] tracking-tight"
        >
          Check the claim,<br />not just the headline.
        </h1>

        <p class="mb-9 max-w-[500px] stagger-3 text-base leading-[1.7] text-ink-2 lg:mb-0">
          Paste a link or a short excerpt. TrustTrace surfaces what it found, what it doubts, and
          what stays unknown.
        </p>
      </div>

      <!-- Right: input card -->
      <div class="w-full lg:w-[440px] lg:shrink-0">
        <ClaimInputCard :submitting="isSubmitting" :error="submitError" @submit="submit" />
      </div>
    </div>

    <!-- Below hero -->
    <HowItWorksPanel />
    <RecentChecksList :items="recentChecks" @select="selectRecentCheck" />
    <LandingInfoColumns />

    <PageFooter class="mt-12">TrustTrace &middot; evidence-first credibility</PageFooter>
  </div>
</template>
