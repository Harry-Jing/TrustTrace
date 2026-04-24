import type { CheckPhase } from '@/features/checks/types'

export const CHECK_PHASES = [
  'accepted',
  'analyzing',
  'synthesizing',
  'persisting',
  'completed',
] as const satisfies readonly CheckPhase[]

export const CHECK_TIPS = [
  'Think about where you first saw this claim.',
  'Who shared it — and why might they have?',
  'Would you bet money on this being accurate?',
  'Can you name a specific source that supports this?',
  'How would you explain this claim to a skeptical friend?',
] as const
