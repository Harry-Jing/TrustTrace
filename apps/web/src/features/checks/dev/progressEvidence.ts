import type { ProgressEvidenceItem } from '@/features/checks/types'

const BASE_PROGRESS_EVIDENCE = [
  {
    sourceName: 'nhtsa.gov',
    title: 'Traffic Safety Facts — Children',
    time: '+1.2s',
    snippet:
      'Seat belts reduce the risk of fatal injury to front-seat passenger-car occupants by 45%.',
  },
  {
    sourceName: 'cdc.gov',
    title: 'Motor Vehicle Safety Data 2025',
    time: '+2.1s',
    snippet: 'Wearing a seat belt is the most effective way to prevent injury or death in a crash.',
  },
  {
    sourceName: 'iihs.org',
    title: 'Seat-belt effectiveness per crash type',
    time: '+3.4s',
    snippet: 'In both front and rear seats, belts reduce the risk of serious injury or death.',
  },
] as const satisfies readonly ProgressEvidenceItem[]

const SYNTHESIS_PROGRESS_EVIDENCE = {
  sourceName: 'who.int',
  title: 'Global status on road safety',
  time: '+4.8s',
  snippet: 'Seat-belt laws and enforcement correlate with 40–50% lower front-seat fatality rates.',
} as const satisfies ProgressEvidenceItem

const PERSISTENCE_PROGRESS_EVIDENCE = {
  sourceName: 'nhtsa.gov',
  title: 'NHTSA meta-analysis 2024',
  time: '+6.1s',
  snippet:
    'Aggregated crash-data studies find ≈45–50% fatal-injury reduction when seat belts are properly worn.',
} as const satisfies ProgressEvidenceItem

export function getDevProgressEvidenceForPhase(phaseIndex: number): ProgressEvidenceItem[] {
  const evidence: ProgressEvidenceItem[] = [...BASE_PROGRESS_EVIDENCE]

  if (phaseIndex >= 2) {
    evidence.push(SYNTHESIS_PROGRESS_EVIDENCE)
  }

  if (phaseIndex >= 3) {
    evidence.push(PERSISTENCE_PROGRESS_EVIDENCE)
  }

  return evidence
}
