import type { BadgeTone } from '@/types/ui'

export type CheckListSort = 'date' | 'cue'

export interface CheckListItem {
  checkId: string
  claim: string
  snippet: string
  createdAt: string
  cue: string
  tone: BadgeTone
}
