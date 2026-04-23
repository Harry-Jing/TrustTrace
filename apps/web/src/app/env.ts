export type ApiMode = 'mock' | 'real'

export const isDevMode = import.meta.env.DEV

function readApiMode(value: unknown): ApiMode | null {
  return value === 'mock' || value === 'real' ? value : null
}

export const apiMode: ApiMode =
  readApiMode(import.meta.env.VITE_TRUSTTRACE_API_MODE) ?? (isDevMode ? 'mock' : 'real')

export const isMockApiMode = apiMode === 'mock'
export const isRealApiMode = apiMode === 'real'
export const showDevTools = isDevMode && isMockApiMode

export const apiBaseUrl = import.meta.env.VITE_TRUSTTRACE_API_BASE_URL || '/v1'
