import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { nextTick } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { CheckRecord } from '@/features/checks/types'
import type * as Vue from 'vue'
import CheckErrorPage from './CheckErrorPage.vue'

const pushMock = vi.hoisted(() => vi.fn<(location: unknown) => void>())
const getCheckMock = vi.hoisted(() => vi.fn<() => Promise<CheckRecord>>())
const createCheckMock = vi.hoisted(() => vi.fn<(input: unknown) => Promise<unknown>>())

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { checkId: 'check-1' } }),
  useRouter: () => ({
    push: pushMock,
  }),
}))

vi.mock('@/features/checks/api/checksApi', () => ({
  getCheck: getCheckMock,
}))

vi.mock('@/features/checks/composables/useCreateCheck', async () => {
  const vue = await vi.importActual<typeof Vue>('vue')

  return {
    useCreateCheck: () => ({
      createCheck: createCheckMock,
      isSubmitting: vue.ref(false),
      submitError: vue.ref(null),
    }),
  }
})

function makeFailedRecord(): CheckRecord {
  const occurredAt = '2026-04-23T12:00:00.000Z'

  return {
    checkId: 'check-1',
    status: 'failed',
    input: { mode: 'text', value: 'A persisted failed claim' },
    progress: {
      checkId: 'check-1',
      status: 'failed',
      phase: 'failed',
      percent: 100,
      message: 'Check failed.',
      eventSeq: 1,
      updatedAt: occurredAt,
    },
    result: null,
    error: {
      code: 'PROVIDER_TIMEOUT',
      category: 'provider timeout',
      message: 'The provider took too long.',
      retryable: true,
      traceId: 'trace-1',
      occurredAt,
    },
    createdAt: occurredAt,
    updatedAt: occurredAt,
    completedAt: null,
  }
}

async function flushAsync() {
  await Promise.resolve()
  await nextTick()
}

describe('CheckErrorPage', () => {
  beforeEach(() => {
    pushMock.mockReset()
    getCheckMock.mockReset()
    getCheckMock.mockResolvedValue(makeFailedRecord())
    createCheckMock.mockReset()
    createCheckMock.mockResolvedValue({})
  })

  it('retries with persisted record input after a refresh clears the store', async () => {
    const wrapper = mount(CheckErrorPage, {
      global: {
        plugins: [createPinia()],
      },
    })

    await flushAsync()

    const retryButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Retry check'))

    expect(retryButton?.exists()).toBe(true)
    await retryButton!.trigger('click')

    expect(createCheckMock).toHaveBeenCalledWith({
      mode: 'text',
      value: 'A persisted failed claim',
    })
  })
})
