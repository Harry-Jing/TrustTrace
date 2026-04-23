import { isMockApiMode } from '@/app/env'
import * as mockClient from '@/features/checks/api/mockChecksClient'
import * as realClient from '@/features/checks/api/realChecksClient'
import type {
  CheckEventHandlers,
  CheckEventSubscription,
  CheckHistoryItem,
  CheckInputDraft,
  CheckRecord,
  CreateCheckResponse,
  RecentCheckItem,
} from '@/features/checks/types'

const client = isMockApiMode ? mockClient : realClient

export function createCheck(input: CheckInputDraft): Promise<CreateCheckResponse> {
  return client.createCheck(input)
}

export function getCheck(checkId: string): Promise<CheckRecord> {
  return client.getCheck(checkId)
}

export function getCheckHistory(): Promise<readonly CheckHistoryItem[]> {
  return client.getCheckHistory()
}

export function getRecentChecks(): Promise<readonly RecentCheckItem[]> {
  return client.getRecentChecks()
}

export function subscribeCheckEvents(
  checkId: string,
  handlers: CheckEventHandlers,
): CheckEventSubscription {
  return client.subscribeCheckEvents(checkId, handlers)
}

/** MOCK ONLY — Reset a mock check record for demo/debug navigation. */
export function devResetCheckProgress(checkId: string): void {
  mockClient.devResetCheckProgress(checkId)
}

/** MOCK ONLY — Force a mock check into a failed state for demo/debug navigation. */
export function devSetCheckFailed(checkId: string): void {
  mockClient.devSetCheckFailed(checkId)
}
