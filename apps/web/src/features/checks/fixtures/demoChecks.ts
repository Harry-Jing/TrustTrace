import type {
  CheckListItem,
  CheckResultViewModel,
  CredibilityCue,
  EvidenceItem,
} from "@/features/checks/types";

export const DEMO_CHECK_ID = "demo-seat-belts";

// `cue` strings here mirror the backend's `verdictLabel(verdictBand)` output
// so mock and real history rows present the same human-readable label.
// `verdictBand` is the stable sort key (matches `VERDICT_BAND_ORDER`).
//
// The four claims cover the four `verdictBand` values that have a per-claim
// fixture in demoResults.ts (strong / mixed / weak / needs_context). Failure
// states are reachable through scenarios (`error.timeout`,
// `error.input_extraction`, `error.provider_config`), so demo claims do not
// double as "failure claims".
export const DEMO_CHECKS = [
  {
    checkId: DEMO_CHECK_ID,
    claim: "Seat belts reduce serious injury in crashes",
    snippet: "Multiple sources confirm 40–55% reduction in fatal injury for belted occupants.",
    createdAt: "2026-04-19T14:32:00.000Z",
    cue: "evidence strong",
    verdictBand: "evidence_strong",
  },
  {
    checkId: "demo-vitamin-c-colds",
    claim: "Vitamin C prevents common colds",
    snippet: "Some evidence for symptom duration, but prevention claims lack strong support.",
    createdAt: "2026-04-18T11:15:00.000Z",
    cue: "evidence mixed",
    verdictBand: "evidence_mixed",
  },
  {
    checkId: "demo-handwritten-notes",
    claim: "Students retain 65% more info from handwritten notes",
    snippet: "The cited 65% figure traces to one study with limited sample size.",
    createdAt: "2026-04-18T08:40:00.000Z",
    cue: "evidence weak",
    verdictBand: "evidence_weak",
  },
  {
    checkId: "demo-ai-dangerous",
    claim: "AI is dangerous",
    snippet:
      "The claim is too broad to evaluate as stated — verdict depends on which systems, harms, and timeframe are meant.",
    createdAt: "2026-04-16T09:55:00.000Z",
    cue: "needs context",
    verdictBand: "needs_context",
  },
] as const satisfies readonly CheckListItem[];

export const DEMO_CHECK_IDS: ReadonlySet<string> = new Set(
  DEMO_CHECKS.map((check) => check.checkId),
);

export const RESULT_CUES = [
  {
    name: "Cross-source consistency",
    text: "NHTSA, IIHS, CDC, and WHO independently align that seat belts reduce serious injury or death.",
    note: "Independent agreement reduces single-source bias.",
    strength: 5,
    tooltip:
      "When multiple unrelated sources reach the same conclusion independently, it’s less likely to be coincidence or bias from a single origin.",
  },
  {
    name: "Source authority",
    text: "Strongest evidence comes from U.S. and international public-safety agencies rather than advocacy-only sources.",
    note: "Authority shape matters for reliability.",
    strength: 4,
    tooltip:
      "Government agencies and research institutions typically have peer review and accountability structures. Advocacy groups may select evidence that supports their position.",
  },
  {
    name: "Publication type",
    text: "Evidence is a mix of agency guidance, safety topics, and a meta review — not a single primary study.",
    note: "Publication form reflects verification rigor.",
    strength: 4,
    tooltip:
      "Systematic reviews and guidance documents aggregate many studies, making them more robust than any single experiment.",
  },
  {
    name: "Recency",
    text: "NHTSA, IIHS, and WHO pages from 2024–2025 indicate guidance remains current.",
    note: "Outdated baselines may not reflect current facts.",
    strength: 5,
    tooltip:
      "Science evolves. A finding from 2005 may have been updated, contradicted, or refined. Recency matters especially for fast-moving fields.",
  },
  {
    name: "Claim specificity",
    text: "The claim is general — stronger evidence exists when narrowed to adults, front-seat occupants, or passenger vehicles.",
    note: "Specific claims are easier to verify.",
    strength: 3,
    tooltip:
      "Vague claims are harder to fact-check because different interpretations may all be “technically true.” More specific claims allow cleaner verification.",
  },
] as const satisfies readonly CredibilityCue[];

export const RESULT_EVIDENCE = [
  {
    sourceName: "nhtsa.gov",
    domain: "nhtsa.gov",
    credibilityLabel: "GOV",
    date: "2025",
    title: "Facts About Seat Belt Use",
    text: "Wearing a seat belt is the most effective way to prevent injury or death in crashes. Lap and shoulder belts reduce serious crash injury and death by about half.",
    url: "https://www.nhtsa.gov/vehicle-safety/seat-belts",
    relation: "supports",
    tier: 1,
    scopeMatch: 0.95,
  },
  {
    sourceName: "iihs.org",
    domain: "iihs.org",
    credibilityLabel: "ORG",
    date: "2025",
    title: "Seat Belts",
    text: "In both the front and the rear, seat belts reduce the risk of serious injury or death in a crash.",
    url: "https://www.iihs.org/topics/seat-belts",
    relation: "supports",
    tier: 1,
    scopeMatch: 0.7,
  },
  {
    sourceName: "cdc.gov",
    domain: "cdc.gov",
    credibilityLabel: "GOV",
    date: "2024",
    title: "Seat Belt Safety: Buckle Up America",
    text: "Buckling up in the front seat of a passenger car reduces the risk of a fatal injury by 45%, and moderate-to-critical injury by 50%.",
    url: "https://www.cdc.gov/seat-belts/about/index.html",
    relation: "supports",
    tier: 2,
    scopeMatch: 0.9,
  },
  {
    sourceName: "who.int",
    domain: "who.int",
    credibilityLabel: "INT'L",
    date: "2025",
    title: "Global Status on Road Safety",
    text: "Seat-belt laws and enforcement correlate with 40–50% lower front-seat fatality rates across high-income countries.",
    url: "https://www.who.int/publications/i/item/9789240086517",
    relation: "supports",
    tier: 2,
    scopeMatch: 0.65,
  },
  {
    sourceName: "nhtsa.gov",
    domain: "nhtsa.gov",
    credibilityLabel: "GOV",
    date: "2024",
    title: "Seat Belts and Child Restraints",
    text: "Lap and shoulder seat belts reduce the risk of moderate to critical injury by 50% when used.",
    url: "https://www.nhtsa.gov/vehicle-safety/child-safety",
    relation: "supports",
    tier: 3,
    scopeMatch: 0.85,
    clusterId: "cluster:nhtsa",
  },
  {
    sourceName: "nap.edu",
    domain: "nap.edu",
    credibilityLabel: "EDU",
    date: "2023",
    title: "Seat Belt Effectiveness — Meta Review",
    text: "Aggregated crash-data studies find ≈45–50% fatal-injury reduction when seat belts are properly worn.",
    url: "https://nap.nationalacademies.org/",
    relation: "neutral",
    tier: 4,
    scopeMatch: 0.8,
  },
] as const satisfies readonly EvidenceItem[];

const RESULT_UNCERTAINTY_LINES = [
  "Claim does not specify passenger type, seating position, or vehicle class.",
  "Sources quantify differently (45% vs 50%) due to different crash samples.",
  "Most data relates to U.S. passenger-vehicle crashes.",
] as const;

const RESULT_NOTE =
  "Familiar framing biases reasoning. Check whether independent sources agree on the same concrete facts, not just the general direction.";

export const CHECK_RESULT = {
  checkId: DEMO_CHECK_ID,
  inputText: "Seat belts reduce serious injury in crashes",
  inputTypeLabel: "text input",
  durationLabel: "7.8s",
  verdictBand: "evidence_strong",
  verdictLabel: "evidence strong",
  headline: "Strong evidence stacks at the top of the ladder.",
  description:
    "Sources are grouped by verification depth — primary, full-text, and independence — so you can see exactly where the strong claim is supported.",
  atAGlance: {
    evidence: 6,
    independent: 4,
    fullText: 5,
    primary: 2,
    snippet: 1,
    uncertainty: "med",
  },
  cues: RESULT_CUES,
  evidence: RESULT_EVIDENCE,
  uncertaintyLines: RESULT_UNCERTAINTY_LINES,
  noteText: RESULT_NOTE,
  summaryText: `TrustTrace check: "Seat belts reduce serious injury in crashes"

Verdict: Strong evidence stacks at the top of the ladder.
Evidence: ${String(RESULT_EVIDENCE.length)} sources · 4 independent · 2 primary · 1 snippet-only
Uncertainty: med

NHTSA, IIHS, CDC, and WHO converge on 40–55% fatal-injury reduction for belted occupants. Claim is broad — specifics vary by passenger type, seating, and vehicle class.`,
} as const satisfies CheckResultViewModel;
