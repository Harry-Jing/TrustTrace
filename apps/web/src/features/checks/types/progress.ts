export type CheckStatus = 'queued' | 'running' | 'completed' | 'failed'
export type CheckPhase =
  | 'accepted'
  | 'analyzing'
  | 'synthesizing'
  | 'persisting'
  | 'completed'
  | 'failed'

export interface CheckProgress {
  checkId: string
  status: CheckStatus
  phase: CheckPhase
  percent: number
  message: string
  eventSeq: number
  updatedAt: string
}
