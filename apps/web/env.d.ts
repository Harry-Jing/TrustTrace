/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TRUSTTRACE_API_MODE?: 'mock' | 'backend'
  readonly VITE_TRUSTTRACE_API_BASE_URL?: string
}
