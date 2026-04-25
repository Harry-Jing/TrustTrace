export type CheckStatus = 'queued' | 'running' | 'completed' | 'failed'

export type ActiveCheckPhase =
  | 'understanding'
  | 'strategy'
  | 'discovery'
  | 'verify_read'
  | 'weigh'
  | 'verdict'

export type CheckPhase = ActiveCheckPhase | 'completed' | 'failed'

export interface CheckProgress {
  checkId: string
  status: CheckStatus
  phase: CheckPhase
  percent: number
  message: string
  eventSeq: number
  updatedAt: string
}
