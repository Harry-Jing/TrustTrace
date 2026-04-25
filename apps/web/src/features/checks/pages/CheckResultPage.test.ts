import { mount } from '@vue/test-utils'
import type { Ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { CheckResultViewModel, CheckStatus } from '@/features/checks/types'
import CheckResultPage from './CheckResultPage.vue'

const reloadMock = vi.hoisted(() => vi.fn<() => Promise<unknown>>())
const resultState = vi.hoisted(() => ({
  checkStatus: null as Ref<CheckStatus> | null,
  result: null as Ref<CheckResultViewModel | null> | null,
  isLoading: null as Ref<boolean> | null,
  isError: null as Ref<boolean> | null,
}))

vi.mock('@/features/checks/composables/useCheckResult', async () => {
  const vue = await vi.importActual<typeof import('vue')>('vue')

  resultState.checkStatus = vue.ref('completed')
  resultState.result = vue.ref(null)
  resultState.isLoading = vue.ref(false)
  resultState.isError = vue.ref(false)

  return {
    useCheckResult: () => ({
      checkStatus: resultState.checkStatus,
      result: resultState.result,
      isLoading: resultState.isLoading,
      isError: resultState.isError,
      reload: reloadMock,
    }),
  }
})

function makeResult(): CheckResultViewModel {
  return {
    checkId: 'check-1',
    inputText: 'Seat belts reduce serious injury in crashes',
    inputTypeLabel: 'text input',
    durationLabel: '7.8s',
    verdictBand: 'evidence_strong',
    verdictLabel: 'evidence strong',
    headline: 'Strong evidence stacks at the top of the ladder.',
    description: 'Multiple verified sources support the claim.',
    atAGlance: {
      evidence: 1,
      independent: 1,
      fullText: 1,
      primary: 1,
      snippet: 0,
      uncertainty: 'low',
    },
    cues: [],
    evidence: [
      {
        sourceName: 'nhtsa.gov',
        domain: 'nhtsa.gov',
        credibilityLabel: 'GOV',
        date: '2025',
        title: 'Facts About Seat Belt Use',
        text: 'Seat belts reduce serious injury in crashes.',
        url: 'https://www.nhtsa.gov/vehicle-safety/seat-belts',
        relation: 'supports',
        tier: 1,
        scopeMatch: 0.95,
      },
    ],
    uncertaintyLines: ['Claim scope is broad.'],
    noteText: 'Read the evidence before sharing.',
    summaryText: 'TrustTrace summary',
  }
}

describe('CheckResultPage', () => {
  beforeEach(() => {
    reloadMock.mockReset()
    resultState.checkStatus!.value = 'completed'
    resultState.result!.value = null
    resultState.isLoading!.value = false
    resultState.isError!.value = false
  })

  it('renders the loading state while a result is still running', () => {
    resultState.checkStatus!.value = 'running'
    resultState.isLoading!.value = true

    const wrapper = mount(CheckResultPage)

    expect(wrapper.text()).toContain('Loading result')
  })

  it('renders a retryable error state when the result cannot load', async () => {
    resultState.isError!.value = true

    const wrapper = mount(CheckResultPage)

    expect(wrapper.text()).toContain('Could not load the result')
    await wrapper.find('button').trigger('click')

    expect(reloadMock).toHaveBeenCalledOnce()
  })

  it('renders the result summary, evidence, and sidebar sections', () => {
    resultState.result!.value = makeResult()

    const wrapper = mount(CheckResultPage, {
      global: {
        stubs: {
          ResultActions: true,
        },
      },
    })

    expect(wrapper.text()).toContain('Strong evidence stacks at the top of the ladder')
    expect(wrapper.text()).toContain('Facts About Seat Belt Use')
    expect(wrapper.text()).toContain('at a glance')
    expect(wrapper.text()).toContain('uncertainty')
  })
})
