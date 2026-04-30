/**
 * DEV ONLY — Page-side composable that re-fetches a check record whenever
 * the dev panel mutates the matching mock record.
 *
 * The dev panel's `forceFail / forceComplete / resetProgress` actions
 * mutate `mockChecksClient`'s in-memory `Map` and then `router.replace`
 * to the corresponding page route. When the user is already on that
 * route for the same `:checkId`, vue-router collapses the navigation to
 * a no-op and the page's own `checkId` watcher does not fire — so the
 * UI would otherwise stay frozen on the previous record state.
 *
 * Composables and pages render the affected check call this composable
 * inside `setup()` to subscribe; the listener self-guards on the matching
 * `checkId` and tears down on Vue scope dispose.
 *
 * In production the `showDevTools` guard collapses the function body to
 * a no-op return, and Vite's static elimination removes the listener
 * code path entirely from the prod bundle.
 */

import { onScopeDispose, type Ref } from "vue";

import { showDevTools } from "@/app/env";

export const MOCK_RECORD_CHANGED_EVENT = "trusttrace:mock-record-changed";

export interface MockRecordChangedDetail {
  readonly checkId: string;
}

export type MockRecordSyncReload = () => unknown;

export function useMockRecordSync(
  checkId: Readonly<Ref<string | null>>,
  reload: MockRecordSyncReload,
): void {
  if (!showDevTools || typeof window === "undefined") return;

  const handler = (event: Event) => {
    const detail = (event as CustomEvent<MockRecordChangedDetail>).detail;
    if (detail.checkId !== checkId.value) return;
    void reload();
  };

  window.addEventListener(MOCK_RECORD_CHANGED_EVENT, handler);
  onScopeDispose(() => {
    window.removeEventListener(MOCK_RECORD_CHANGED_EVENT, handler);
  });
}

/**
 * DEV ONLY — internal helper for the mock client to broadcast that a
 * record changed. Lives in `dev/` (not in the mock client) because the
 * event itself is a dev-tooling concept; the mock client only emits.
 */
export function dispatchMockRecordChanged(checkId: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<MockRecordChangedDetail>(MOCK_RECORD_CHANGED_EVENT, {
      detail: { checkId },
    }),
  );
}
