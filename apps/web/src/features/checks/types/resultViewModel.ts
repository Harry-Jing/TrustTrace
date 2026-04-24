import type { CredibilityCue } from '@/features/checks/types/cues'
import type { EvidenceItem } from '@/features/checks/types/evidence'

export type ResultStatTone = 'accent' | 'warn' | 'muted'

export interface ResultStatViewModel {
  value: string
  label: string
  barRatio: number
  tone: ResultStatTone
}

export interface CheckResultViewModel {
  checkId: string
  inputText: string
  inputTypeLabel: string
  statusCue: string
  summaryState: string
  completedMeta: string
  headline: string
  description: string
  cues: readonly CredibilityCue[]
  evidence: readonly EvidenceItem[]
  uncertaintyLines: readonly string[]
  summaryText: string
  stats: readonly ResultStatViewModel[]
}
