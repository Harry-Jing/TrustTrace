import type {
  CheckListItem,
  CheckPhase,
  CheckResult,
  CredibilityCue,
  EvidenceItem,
  ProgressEvidenceItem,
} from '@/features/checks/types'

export const DEMO_CHECK_ID = 'demo-seat-belts'

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

export const DEMO_CHECKS = [
  {
    id: DEMO_CHECK_ID,
    claim: 'Seat belts reduce serious injury in crashes',
    snippet: 'Multiple sources confirm 40–55% reduction in fatal injury for belted occupants.',
    createdAt: '2026-04-19T14:32:00.000Z',
    cue: 'evidence strong',
    tone: 'accent',
  },
  {
    id: 'demo-vitamin-c-colds',
    claim: 'Vitamin C prevents common colds',
    snippet: 'Some evidence for symptom duration, but prevention claims lack strong support.',
    createdAt: '2026-04-18T11:15:00.000Z',
    cue: 'mixed evidence',
    tone: 'default',
  },
  {
    id: 'demo-handwritten-notes',
    claim: 'Students retain 65% more info from handwritten notes',
    snippet: 'The cited 65% figure traces to one study with limited sample size.',
    createdAt: '2026-04-18T08:40:00.000Z',
    cue: 'weak evidence',
    tone: 'warn',
  },
  {
    id: 'demo-coffee-lifespan',
    claim: 'Coffee shortens lifespan by 3 years',
    snippet:
      'Major cohort studies associate moderate coffee intake with neutral or positive outcomes.',
    createdAt: '2026-04-17T16:20:00.000Z',
    cue: 'contradicted',
    tone: 'warn',
  },
  {
    id: 'demo-ev-batteries',
    claim: 'EV batteries pollute more than gas cars over lifetime',
    snippet: 'Lifecycle analyses vary by region and energy mix; headline claim oversimplifies.',
    createdAt: '2026-04-16T09:55:00.000Z',
    cue: 'mixed evidence',
    tone: 'default',
  },
  {
    id: 'demo-dim-light-eyesight',
    claim: 'Reading in dim light permanently damages eyesight',
    snippet: 'Ophthalmology consensus: temporary strain yes, permanent damage no.',
    createdAt: '2026-04-15T13:10:00.000Z',
    cue: 'contradicted',
    tone: 'warn',
  },
] as const satisfies readonly CheckListItem[]

export const DEMO_CHECK_IDS: ReadonlySet<string> = new Set(DEMO_CHECKS.map((c) => c.id))

export const CUE_ORDER: Record<string, number> = {
  'evidence strong': 0,
  'mixed evidence': 1,
  'weak evidence': 2,
  contradicted: 3,
}

export const RESULT_CUES = [
  {
    name: 'Cross-source consistency',
    text: 'CDC, NHTSA, and IIHS independently align that seat belts reduce serious injury or death.',
    note: 'Independent agreement reduces single-source bias.',
    strength: 5,
    tooltip:
      'When multiple unrelated sources reach the same conclusion independently, it’s less likely to be coincidence or bias from a single origin.',
  },
  {
    name: 'Claim specificity',
    text: 'The claim is general — stronger evidence exists when narrowed to adults, front-seat occupants, or passenger vehicles.',
    note: 'Specific claims are easier to verify.',
    strength: 3,
    tooltip:
      'Vague claims are harder to fact-check because different interpretations may all be “technically true.” More specific claims allow cleaner verification.',
  },
  {
    name: 'Source context',
    text: 'Strongest evidence comes from U.S. public-safety agencies rather than advocacy-only sources.',
    note: 'Source origin matters for reliability.',
    strength: 4,
    tooltip:
      'Government agencies and research institutions typically have peer review and accountability structures. Advocacy groups may select evidence that supports their position.',
  },
  {
    name: 'Publication type',
    text: 'Evidence includes agency guidance and safety-topic summaries that synthesize research rather than single primary studies.',
    note: 'Publication form reflects verification rigor.',
    strength: 4,
    tooltip:
      'Systematic reviews and guidance documents aggregate many studies, making them more robust than any single experiment.',
  },
  {
    name: 'Recency',
    text: 'CDC and NHTSA pages from 2025–2026 indicate guidance remains current.',
    note: 'Outdated baselines may not reflect current facts.',
    strength: 5,
    tooltip:
      'Science evolves. A finding from 2005 may have been updated, contradicted, or refined. Recency matters especially for fast-moving fields.',
  },
] as const satisfies readonly CredibilityCue[]

export const RESULT_EVIDENCE = [
  {
    src: 'CDC',
    domain: '.gov',
    credLabel: 'GOV',
    date: '2025-12-17',
    title: 'Facts About Seat Belt Use',
    text: 'Wearing a seat belt is the most effective way to prevent injury or death in crashes. For adults and older children, lap-and-shoulder belts reduce serious crash injury and death by about half.',
    url: '#',
    relation: 'supports',
  },
  {
    src: 'NHTSA',
    domain: '.gov',
    credLabel: 'GOV',
    date: '2024',
    title: 'Seat Belt Safety: Buckle Up America',
    text: 'Buckling up in the front seat of a passenger car reduces the risk of a fatal injury by 45%, and moderate-to-critical injury by 50%.',
    url: '#',
    relation: 'supports',
  },
  {
    src: 'IIHS',
    domain: '.org',
    credLabel: 'ORG',
    date: '2025',
    title: 'Seat Belts',
    text: 'In both the front and the rear, seat belts reduce the risk of serious injury or death in a crash.',
    url: '#',
    relation: 'supports',
  },
  {
    src: 'NHTSA',
    domain: '.gov',
    credLabel: 'GOV',
    date: '2024',
    title: 'Seat Belts and Child Restraints',
    text: 'Lap and shoulder seat belts reduce the risk of moderate to critical injury to front-seat passenger-car occupants by 50% when used.',
    url: '#',
    relation: 'supports',
  },
  {
    src: 'WHO',
    domain: '.int',
    credLabel: "INT'L",
    date: '2025',
    title: 'Global Status on Road Safety',
    text: 'Seat-belt laws and enforcement correlate with 40–50% lower front-seat fatality rates across high-income countries.',
    url: '#',
    relation: 'supports',
  },
  {
    src: 'NAP',
    domain: '.edu',
    credLabel: 'EDU',
    date: '2023',
    title: 'Seat Belt Effectiveness — Meta Review',
    text: 'Aggregated crash-data studies find ≈45–50% fatal-injury reduction when seat belts are properly worn in passenger vehicles.',
    url: '#',
    relation: 'neutral',
  },
] as const satisfies readonly EvidenceItem[]

export const CHECK_RESULT = {
  id: DEMO_CHECK_ID,
  inputText: 'Seat belts reduce serious injury in crashes',
  inputTypeLabel: 'text input',
  statusCue: 'evidence strong',
  summaryState: 'completed',
  completedMeta: 'completed · 7.8s',
  headline: 'Multiple evidence cues are available — verify before sharing.',
  description:
    'CDC, NHTSA, IIHS, and WHO all converge on a 40–55% reduction in fatal or serious injury for belted occupants. However, the claim is broad — specifics vary by context.',
  cues: RESULT_CUES,
  evidence: RESULT_EVIDENCE,
  uncertaintyLines: [
    'The claim does not specify passenger type, seating position, or vehicle class.',
    'Sources quantify differently (45% vs 50%) due to different crash samples.',
    'Most data relates to U.S. passenger-vehicle crashes.',
  ],
  summaryText: `TrustTrace check: "Seat belts reduce serious injury in crashes"\n\nResult: Multiple evidence cues are available — verify before sharing.\nEvidence: ${RESULT_EVIDENCE.length} sources (CDC, NHTSA, IIHS, WHO)\nUncertainty: med\n\nCDC, NHTSA, IIHS, and WHO converge on 40–55% fatal injury reduction for belted occupants. Claim is broad — specifics vary by context.`,
  stats: [
    {
      val: String(RESULT_EVIDENCE.length),
      label: 'Evidence',
      bar: RESULT_EVIDENCE.length / 6,
      tone: 'accent',
    },
    { val: '5', label: 'Cues', bar: 1, tone: 'accent' },
    { val: 'med', label: 'Uncertainty', bar: 0.6, tone: 'warn' },
    { val: '7.8s', label: 'Duration', bar: 0.78, tone: 'muted' },
  ],
} as const satisfies CheckResult

const BASE_PROGRESS_EVIDENCE = [
  {
    src: 'nhtsa.gov',
    title: 'Traffic Safety Facts — Children',
    time: '+1.2s',
    snippet:
      'Seat belts reduce the risk of fatal injury to front-seat passenger-car occupants by 45%.',
  },
  {
    src: 'cdc.gov',
    title: 'Motor Vehicle Safety Data 2025',
    time: '+2.1s',
    snippet: 'Wearing a seat belt is the most effective way to prevent injury or death in a crash.',
  },
  {
    src: 'iihs.org',
    title: 'Seat-belt effectiveness per crash type',
    time: '+3.4s',
    snippet: 'In both front and rear seats, belts reduce the risk of serious injury or death.',
  },
] as const satisfies readonly ProgressEvidenceItem[]

const SYNTHESIS_PROGRESS_EVIDENCE = {
  src: 'who.int',
  title: 'Global status on road safety',
  time: '+4.8s',
  snippet: 'Seat-belt laws and enforcement correlate with 40–50% lower front-seat fatality rates.',
} as const satisfies ProgressEvidenceItem

const PERSISTENCE_PROGRESS_EVIDENCE = {
  src: 'nhtsa.gov',
  title: 'NHTSA meta-analysis 2024',
  time: '+6.1s',
  snippet:
    'Aggregated crash-data studies find ≈45–50% fatal-injury reduction when seat belts are properly worn.',
} as const satisfies ProgressEvidenceItem

export function getProgressEvidenceForPhase(phaseIndex: number): ProgressEvidenceItem[] {
  const evidence: ProgressEvidenceItem[] = [...BASE_PROGRESS_EVIDENCE]

  if (phaseIndex >= 2) {
    evidence.push(SYNTHESIS_PROGRESS_EVIDENCE)
  }

  if (phaseIndex >= 3) {
    evidence.push(PERSISTENCE_PROGRESS_EVIDENCE)
  }

  return evidence
}
