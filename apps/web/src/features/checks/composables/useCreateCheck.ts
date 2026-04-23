import { useRouter } from 'vue-router'

import { createCheck as createCheckRequest } from '@/features/checks/api/checksApi'
import { useChecksStore } from '@/features/checks/stores/checks.store'
import type { CheckInputDraft } from '@/features/checks/types'

export function useCreateCheck() {
  const router = useRouter()
  const checks = useChecksStore()

  async function createCheck(input: CheckInputDraft) {
    const response = await createCheckRequest(input)
    checks.rememberCreatedCheck(input, response)
    await router.push({ name: 'loading', params: { checkId: response.checkId } })
    return response
  }

  return { createCheck }
}
