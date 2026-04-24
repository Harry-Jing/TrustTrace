export type ApiMode = 'mock' | 'backend'

export const isDevMode = import.meta.env.DEV

export function readApiMode(value: unknown): ApiMode | null {
  if (value === undefined || value === null || value === '') return null
  if (value === 'mock' || value === 'backend') return value

  throw new Error('VITE_TRUSTTRACE_API_MODE must be "mock" or "backend".')
}

export const apiMode: ApiMode =
  readApiMode(import.meta.env.VITE_TRUSTTRACE_API_MODE) ?? (isDevMode ? 'mock' : 'backend')

export const isMockApiMode = apiMode === 'mock'
export const isBackendApiMode = apiMode === 'backend'
export const showDevTools = isDevMode && isMockApiMode

export const apiBaseUrl = import.meta.env.VITE_TRUSTTRACE_API_BASE_URL || '/v1'
