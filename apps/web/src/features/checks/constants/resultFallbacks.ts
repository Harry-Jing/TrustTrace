import type { VerdictBand } from '@/features/checks/types'

interface VerdictFallbackCopy {
  label: string
  headline: string
  description: string
}

export const VERDICT_FALLBACK_COPY: Record<VerdictBand, VerdictFallbackCopy> = {
  evidence_strong: {
    label: 'evidence strong',
    headline: 'Strong evidence is available.',
    description: 'Verified sources provide a strong evidence base for reviewing this claim.',
  },
  evidence_mixed: {
    label: 'mixed evidence',
    headline: 'The evidence is mixed.',
    description: 'Verified sources point in more than one direction or depend on scope.',
  },
  evidence_weak: {
    label: 'weak evidence',
    headline: 'The evidence is weak.',
    description: 'Verified sources provide limited support for the claim as stated.',
  },
  evidence_thin: {
    label: 'thin evidence',
    headline: 'There is not much evidence yet.',
    description: 'The available sources are too thin to carry a strong conclusion.',
  },
  needs_context: {
    label: 'needs context',
    headline: 'More context is needed.',
    description: 'The claim needs more scope, timing, or source context before weighing evidence.',
  },
  system_failed: {
    label: 'system failed',
    headline: 'The check could not complete.',
    description: 'The system failed before enough verified evidence could be presented.',
  },
}

export function readVerdictCopy(
  verdictBand: VerdictBand,
  field: keyof VerdictFallbackCopy,
  value: string,
) {
  const trimmed = value.trim()
  return trimmed || VERDICT_FALLBACK_COPY[verdictBand][field]
}
