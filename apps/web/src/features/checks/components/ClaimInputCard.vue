<script setup lang="ts">
import { computed, ref } from 'vue'

import type { CheckInputDraft, CheckInputMode } from '@/features/checks/types'

const emit = defineEmits<{
  submit: [input: CheckInputDraft]
}>()

const mode = ref<CheckInputMode>('text')
const value = ref('')
const inputFocused = ref(false)
const inputId = 'claim-input'

const charCount = computed(() => value.value.length)
const URL_PATTERN = /\w+\.\w{2,}/
const isValid = computed(() =>
  mode.value === 'url'
    ? URL_PATTERN.test(value.value.trim())
    : charCount.value >= 3 && charCount.value <= 10000,
)

function switchMode(nextMode: CheckInputMode) {
  mode.value = nextMode
  value.value = ''
}

function submit() {
  if (!isValid.value) return
  emit('submit', { mode: mode.value, value: value.value })
}
</script>

<template>
  <form
    class="stagger-4 rounded-2xl border-[1.5px] bg-card p-5 text-left transition-[border-color,box-shadow,background-color] duration-200 sm:p-6"
    :class="
      inputFocused ? 'border-accent shadow-input-focus' : 'border-line-strong shadow-input-rest'
    "
    @focusin="inputFocused = true"
    @focusout="inputFocused = false"
    @submit.prevent="submit"
  >
    <!-- Mode toggle + char count -->
    <div class="mb-3.5 flex items-center gap-3">
      <div
        class="claim-mode-toggle relative inline-flex overflow-hidden rounded-full bg-surface-alt p-[3px]"
        role="group"
        aria-label="Claim input type"
      >
        <!-- Sliding indicator -->
        <div
          class="claim-mode-toggle__indicator absolute top-[3px] h-[calc(100%-6px)] w-[calc(50%-3px)] rounded-full transition-[left] duration-250 ease-snappy"
          :class="mode === 'text' ? 'left-[3px]' : 'left-1/2'"
        />
        <button
          v-for="m in ['text', 'url'] as const"
          :key="m"
          type="button"
          class="claim-mode-toggle__button text-body-sm relative z-10 min-w-16 rounded-full border-none bg-transparent px-5 py-[7px] font-mono font-medium tracking-[0.04em] uppercase transition-colors duration-200"
          :class="mode === m ? 'claim-mode-toggle__button--active' : ''"
          :aria-pressed="mode === m"
          @click="switchMode(m)"
        >
          {{ m }}
        </button>
      </div>
      <span class="flex-1" />
      <span
        v-if="mode === 'text'"
        class="font-mono text-[11px] tracking-[0.03em]"
        :class="charCount > 10000 ? 'text-warn' : 'text-muted'"
      >
        {{ charCount.toLocaleString() }} / 10,000
      </span>
    </div>

    <!-- Input field -->
    <label class="sr-only" :for="inputId">Claim to check</label>
    <input
      v-if="mode === 'url'"
      :id="inputId"
      v-model="value"
      type="text"
      placeholder="https://example.com/article-to-check"
      class="w-full border-none bg-transparent py-2.5 text-base leading-relaxed text-ink outline-none"
    />
    <textarea
      v-else
      :id="inputId"
      v-model="value"
      placeholder="Paste the claim or excerpt you want to double-check…"
      :rows="3"
      class="max-h-[200px] min-h-20 w-full resize-y border-none bg-transparent text-[15px] leading-[1.7] text-ink outline-none"
    />

    <!-- Submit row -->
    <div class="mt-3.5 flex items-center justify-between border-t border-line pt-3.5">
      <span class="font-mono text-[11px] tracking-[0.03em] text-muted">
        {{ mode === 'url' ? 'paste a full URL' : 'min 3 characters' }}
      </span>
      <button
        type="submit"
        class="tt-btn rounded-lg border-none px-7 py-2.5 text-sm font-semibold transition-all duration-250"
        :class="
          isValid
            ? 'cursor-pointer bg-accent text-white'
            : 'cursor-default bg-surface-alt text-muted'
        "
        :disabled="!isValid"
      >
        Run credibility check
      </button>
    </div>
  </form>
</template>
