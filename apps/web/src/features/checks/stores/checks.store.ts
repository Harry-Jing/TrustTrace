import { defineStore } from 'pinia'

import type { CheckInputDraft, CheckProgress, CreateCheckResponse } from '@/features/checks/types'

export const useChecksStore = defineStore('checks', {
  state: () => ({
    currentCheckId: null as string | null,
    currentInput: null as CheckInputDraft | null,
    progressByCheckId: {} as Record<string, CheckProgress>,
    eventsUrlByCheckId: {} as Record<string, string>,
  }),
  actions: {
    rememberCreatedCheck(input: CheckInputDraft, response: CreateCheckResponse) {
      this.currentCheckId = response.checkId
      this.currentInput = input
      this.progressByCheckId[response.checkId] = response.progress
      this.eventsUrlByCheckId[response.checkId] = response.eventsUrl
    },
    setCurrentCheckId(checkId: string) {
      this.currentCheckId = checkId
    },
    recordProgress(progress: CheckProgress) {
      this.currentCheckId = progress.checkId
      this.progressByCheckId[progress.checkId] = progress
    },
  },
})
