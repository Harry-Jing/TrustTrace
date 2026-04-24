import type { CheckApiError } from '@/features/checks/types/api'
import type { CheckPhase, CheckStatus } from '@/features/checks/types/progress'

export interface ProgressEvent {
  seq: number
  checkId: string
  status: CheckStatus
  phase: CheckPhase
  percent: number
  message: string
  provider: string | null
  stepCode: string | null
  error: CheckApiError | null
  createdAt: string
}

export interface CheckEventHandlers {
  onEvent?: (event: ProgressEvent) => void
  onError?: (error: unknown) => void
  onClose?: () => void
}

export interface CheckEventSubscription {
  close: () => void
}

export interface CheckEventSubscriptionOptions {
  eventsUrl?: string
  afterSeq?: number
}
