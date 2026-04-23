/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TRUSTTRACE_API_MODE?: 'mock' | 'real'
  readonly VITE_TRUSTTRACE_API_BASE_URL?: string
}
