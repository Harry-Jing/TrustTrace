import { defineStore } from "pinia";

import type { CheckInputDraft, CheckProgress, CreateCheckResponse } from "@/features/checks/types";

interface ChecksState {
  currentCheckId: string | null;
  currentInput: CheckInputDraft | null;
  progressByCheckId: Record<string, CheckProgress>;
  eventsUrlByCheckId: Record<string, string>;
}

export const useChecksStore = defineStore("checks", {
  state: (): ChecksState => ({
    currentCheckId: null,
    currentInput: null,
    progressByCheckId: {},
    eventsUrlByCheckId: {},
  }),
  actions: {
    rememberCreatedCheck(input: CheckInputDraft, response: CreateCheckResponse) {
      this.currentCheckId = response.checkId;
      this.currentInput = input;
      this.progressByCheckId[response.checkId] = response.progress;
      this.eventsUrlByCheckId[response.checkId] = response.eventsUrl;
    },
    setCurrentCheckId(checkId: string) {
      this.currentCheckId = checkId;
    },
    recordProgress(progress: CheckProgress) {
      this.currentCheckId = progress.checkId;
      this.progressByCheckId[progress.checkId] = progress;
    },
  },
});
