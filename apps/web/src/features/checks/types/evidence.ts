export interface ProgressEvidenceItem {
  sourceName: string
  title: string
  time: string
  snippet: string
}

export type EvidenceRelation = 'supports' | 'contradicts' | 'neutral'

export interface EvidenceItem {
  sourceName: string
  domain: string
  credibilityLabel: string
  date: string
  title: string
  text: string
  url: string
  relation: EvidenceRelation
}
