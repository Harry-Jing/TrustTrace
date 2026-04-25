import { setActivePinia, createPinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useCreateCheck } from '@/features/checks/composables/useCreateCheck'
import { useChecksStore } from '@/features/checks/stores/checks.store'
import type { CreateCheckResponse } from '@/features/checks/types'

const pushMock = vi.hoisted(() => vi.fn<(location: unknown) => Promise<void>>())
const createCheckRequestMock = vi.hoisted(() =>
  vi.fn<(input: unknown) => Promise<CreateCheckResponse>>(),
)

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}))

vi.mock('@/features/checks/api/checksApi', () => ({
  createCheck: createCheckRequestMock,
}))

function makeCreateResponse(checkId = 'mock-check-created'): CreateCheckResponse {
  const createdAt = '2026-04-23T12:00:00.000Z'

  return {
    checkId,
    status: 'running',
    progress: {
      checkId,
      status: 'running',
      phase: 'understanding',
      percent: 8,
      message: 'Reading the input and parsing it into checkable claims.',
      eventSeq: 1,
      updatedAt: createdAt,
    },
    eventsUrl: `/v1/checks/${checkId}/events`,
    createdAt,
  }
}

describe('useCreateCheck', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    pushMock.mockReset()
    pushMock.mockResolvedValue(undefined)
    createCheckRequestMock.mockReset()
  })

  it('waits for a created check id before navigating to loading', async () => {
    const response = makeCreateResponse()
    createCheckRequestMock.mockResolvedValue(response)
    const { createCheck, isSubmitting, submitError } = useCreateCheck()
    const created = await createCheck({ mode: 'text', value: 'A claim to create' })
    const checks = useChecksStore()

    expect(created.checkId).toBe(response.checkId)
    expect(checks.currentCheckId).toBe(response.checkId)
    expect(checks.progressByCheckId[response.checkId]?.phase).toBe('understanding')
    expect(pushMock).toHaveBeenCalledWith({
      name: 'loading',
      params: { checkId: response.checkId },
    })
    expect(isSubmitting.value).toBe(false)
    expect(submitError.value).toBeNull()
  })

  it('records submit errors and does not navigate when create fails', async () => {
    const failure = new Error('Network unavailable')
    createCheckRequestMock.mockRejectedValue(failure)
    const { createCheck, isSubmitting, submitError } = useCreateCheck()
    const checks = useChecksStore()

    await expect(createCheck({ mode: 'text', value: 'A claim to create' })).rejects.toThrow(
      'Network unavailable',
    )

    expect(checks.currentCheckId).toBeNull()
    expect(pushMock).not.toHaveBeenCalled()
    expect(isSubmitting.value).toBe(false)
    expect(submitError.value).toBe(failure)
  })
})
