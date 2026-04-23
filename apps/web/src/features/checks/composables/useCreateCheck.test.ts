import { setActivePinia, createPinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useCreateCheck } from '@/features/checks/composables/useCreateCheck'
import { useChecksStore } from '@/features/checks/stores/checks.store'

const pushMock = vi.hoisted(() => vi.fn<(location: unknown) => void>())

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}))

describe('useCreateCheck', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    pushMock.mockReset()
  })

  it('waits for a created check id before navigating to loading', async () => {
    const { createCheck } = useCreateCheck()
    const response = await createCheck({ mode: 'text', value: 'A claim to create' })
    const checks = useChecksStore()

    expect(response.checkId).toMatch(/^mock-check-/)
    expect(checks.currentCheckId).toBe(response.checkId)
    expect(checks.progressByCheckId[response.checkId]?.phase).toBe('accepted')
    expect(pushMock).toHaveBeenCalledWith({
      name: 'loading',
      params: { checkId: response.checkId },
    })
  })
})
