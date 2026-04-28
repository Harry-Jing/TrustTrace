import { ref } from "vue";
import { useRouter } from "vue-router";

import { createCheck as createCheckRequest } from "@/features/checks/api/checksApi";
import { useChecksStore } from "@/features/checks/stores/checks.store";
import type { CheckInputDraft } from "@/features/checks/types";
import { usePreferencesStore } from "@/stores/preferences.store";

export function useCreateCheck() {
  const router = useRouter();
  const checks = useChecksStore();
  const preferences = usePreferencesStore();
  const isSubmitting = ref(false);
  const submitError = ref<unknown>(null);

  async function createCheck(input: CheckInputDraft) {
    isSubmitting.value = true;
    submitError.value = null;

    try {
      const response = await createCheckRequest(input, preferences.discoveryStrategy);
      checks.rememberCreatedCheck(input, response);
      await router.push({ name: "loading", params: { checkId: response.checkId } });
      return response;
    } catch (error) {
      submitError.value = error;
      throw error;
    } finally {
      isSubmitting.value = false;
    }
  }

  return { createCheck, isSubmitting, submitError };
}
