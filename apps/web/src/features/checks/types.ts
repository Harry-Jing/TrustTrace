import type { BadgeTone } from '@/types/ui'

export type CheckInputMode = 'text' | 'url'
export type CheckStatus = 'queued' | 'running' | 'completed' | 'failed'
export type CheckPhase =
  | 'accepted'
  | 'analyzing'
  | 'synthesizing'
  | 'persisting'
  | 'completed'
  | 'failed'
export type CheckListSort = 'date' | 'cue'

export interface CheckListParams {
  limit?: number
  offset?: number
}

export interface CheckInputDraft {
  mode: CheckInputMode
  value: string
}

export interface CheckApiError {
  code: string
  category: string
  message: string
  retryable: boolean
  traceId: string | null
  occurredAt: string
}

export interface CheckProgress {
  checkId: string
  status: CheckStatus
  phase: CheckPhase
  percent: number
  message: string
  eventSeq: number
  updatedAt: string
}

export interface CreateCheckResponse {
  checkId: string
  status: CheckStatus
  progress: CheckProgress
  eventsUrl: string
  createdAt: string
}

export interface ProgressEvent {
  seq: number
  checkId: string
  status: CheckStatus
  phase: CheckPhase
  percent: number
  message: string
  provider: string | null
  stepCode: string | null
  error: CheckApiError | null
  createdAt: string
}

export interface CheckEventHandlers {
  onEvent?: (event: ProgressEvent) => void
  onError?: (error: unknown) => void
  onClose?: () => void
}

export interface CheckEventSubscription {
  close: () => void
}

export interface CheckEventSubscriptionOptions {
  eventsUrl?: string
  afterSeq?: number
}

export interface CheckListItem {
  id: string
  claim: string
  snippet: string
  createdAt: string
  cue: string
  tone: BadgeTone
}

export interface ProgressEvidenceItem {
  src: string
  title: string
  time: string
  snippet: string
}

export interface CredibilityCue {
  name: string
  text: string
  note: string
  strength: number
  tooltip: string
}

export type EvidenceRelation = 'supports' | 'contradicts' | 'neutral'

export interface EvidenceItem {
  src: string
  domain: string
  credLabel: string
  date: string
  title: string
  text: string
  url: string
  relation: EvidenceRelation
}

export type ResultStatTone = 'accent' | 'warn' | 'muted'

export interface ResultStat {
  val: string
  label: string
  bar: number
  tone: ResultStatTone
}

export interface CheckResult {
  id: string
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
  stats: readonly ResultStat[]
}

export interface CheckRecord {
  checkId: string
  status: CheckStatus
  progress: CheckProgress
  result: CheckResult | null
  error: CheckApiError | null
  createdAt: string
  updatedAt: string
  completedAt: string | null
}
