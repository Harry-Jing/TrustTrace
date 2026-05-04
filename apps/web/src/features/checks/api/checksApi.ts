import { isMockApiMode } from "@/app/env";
import * as mockClient from "@/features/checks/api/mockChecksClient";
import * as backendClient from "@/features/checks/api/backendChecksClient";
import type {
  CheckEventHandlers,
  CheckEventSubscription,
  CheckEventSubscriptionOptions,
  CheckInputDraft,
  CheckListItem,
  CheckListParams,
  CheckRecord,
  CreateCheckResponse,
} from "@/features/checks/types";
import type { DiscoveryStrategy } from "@/features/checks/types/progress";

const client = isMockApiMode ? mockClient : backendClient;

export function createCheck(
  input: CheckInputDraft,
  discoveryStrategy: DiscoveryStrategy,
): Promise<CreateCheckResponse> {
  return client.createCheck(input, discoveryStrategy);
}

export function getCheck(checkId: string): Promise<CheckRecord> {
  return client.getCheck(checkId);
}

export function listChecks(params?: CheckListParams): Promise<readonly CheckListItem[]> {
  return client.listChecks(params);
}

export function subscribeCheckEvents(
  checkId: string,
  handlers: CheckEventHandlers,
  options?: CheckEventSubscriptionOptions,
): CheckEventSubscription {
  return client.subscribeCheckEvents(checkId, handlers, options);
}

/** MOCK ONLY — Reset a mock check record for demo/debug navigation. */
export function devResetCheckProgress(checkId: string): void {
  mockClient.devResetCheckProgress(checkId);
}

/** MOCK ONLY — Force a mock check into a failed state for demo/debug navigation. */
export function devSetCheckFailed(checkId: string): void {
  mockClient.devSetCheckFailed(checkId);
}

/** MOCK ONLY — Force a mock check into the completed state with a demo result. */
export function devSetCheckCompleted(checkId: string): void {
  mockClient.devSetCheckCompleted(checkId);
}
