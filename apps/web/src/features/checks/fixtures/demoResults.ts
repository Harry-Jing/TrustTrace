/**
 * MOCK ONLY — Per-demo-claim result fixtures.
 *
 * Each demo claim ID maps to a result view model with a deliberately distinct
 * `verdictBand`, headline, cue mix, and evidence relations so swapping demo
 * claims in the dev panel produces visibly different result-page renders.
 * Sources are illustrative, not real citations — these fixtures exist for
 * UI coverage of the verdict-band space, not factual claim-checking.
 */

import { CHECK_RESULT } from "@/features/checks/fixtures/demoChecks";
import type { CheckResultViewModel, CredibilityCue, EvidenceItem } from "@/features/checks/types";

const VITAMIN_C_CUES: readonly CredibilityCue[] = [
  {
    name: "Cross-source consistency",
    text: "Cochrane and large meta-analyses agree on a small effect on cold duration but contradict the broader 'prevents colds' framing.",
    note: "Sources align on duration, diverge on prevention.",
    strength: 3,
    tooltip:
      "When sources agree on the narrow finding but contradict a broader phrasing, the broader claim is the one that fails verification.",
  },
  {
    name: "Claim specificity",
    text: "The claim treats 'prevents' and 'shortens' as equivalent, but the literature carefully separates them.",
    note: "Vague verbs hide weak evidence.",
    strength: 2,
    tooltip:
      "A specific claim ('shortens duration by ~10%') is verifiable; a vague claim ('prevents colds') is rhetorical.",
  },
  {
    name: "Publication type",
    text: "Strongest evidence is a Cochrane systematic review; advocacy sources reframe it more aggressively than the review itself.",
    note: "Reviews aggregate, advocacy amplifies.",
    strength: 4,
    tooltip:
      "Systematic reviews are robust. Press coverage and advocacy posts often summarize them in ways the original authors would not endorse.",
  },
] as const;

const VITAMIN_C_EVIDENCE: readonly EvidenceItem[] = [
  {
    sourceName: "cochranelibrary.com",
    domain: "cochranelibrary.com",
    credibilityLabel: "EDU",
    date: "2024",
    title: "Vitamin C for preventing and treating the common cold",
    text: "Regular supplementation does not appreciably reduce incidence of colds in the general adult population, but reduces duration of symptoms by ~8%.",
    url: "https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD000980.pub5/full",
    relation: "contradicts",
    tier: 1,
    scopeMatch: 0.9,
  },
  {
    sourceName: "nih.gov",
    domain: "ods.od.nih.gov",
    credibilityLabel: "GOV",
    date: "2024",
    title: "Vitamin C — Health Professional Fact Sheet",
    text: "Routine vitamin C supplementation is not justified to prevent colds in the general population.",
    url: "https://ods.od.nih.gov/factsheets/VitaminC-HealthProfessional/",
    relation: "contradicts",
    tier: 1,
    scopeMatch: 0.85,
  },
  {
    sourceName: "harvard.edu",
    domain: "hsph.harvard.edu",
    credibilityLabel: "EDU",
    date: "2023",
    title: "Vitamin C — The Nutrition Source",
    text: "Some evidence that supplementation modestly shortens cold duration, especially under physical stress; minimal effect on incidence.",
    url: "https://www.hsph.harvard.edu/nutritionsource/vitamin-c/",
    relation: "neutral",
    tier: 2,
    scopeMatch: 0.8,
  },
  {
    sourceName: "linus pauling institute",
    domain: "lpi.oregonstate.edu",
    credibilityLabel: "EDU",
    date: "2023",
    title: "Vitamin C and the common cold",
    text: "Cumulative evidence suggests vitamin C may be useful for individuals exposed to brief periods of severe physical exercise or cold environments.",
    url: "https://lpi.oregonstate.edu/mic/vitamins/vitamin-C",
    relation: "supports",
    tier: 2,
    scopeMatch: 0.55,
  },
] as const;

const VITAMIN_C_RESULT: CheckResultViewModel = {
  checkId: "demo-vitamin-c-colds",
  inputText: "Vitamin C prevents common colds",
  inputTypeLabel: "text input",
  durationLabel: "6.4s",
  verdictBand: "evidence_mixed",
  verdictLabel: "evidence mixed",
  headline: "Sources support a smaller claim than the one being made.",
  description:
    "The literature contradicts the strict 'prevents' claim while supporting a narrower one (modestly shorter duration). The framing is doing more work than the evidence.",
  atAGlance: {
    evidence: 4,
    independent: 3,
    fullText: 3,
    primary: 1,
    snippet: 1,
    uncertainty: "med",
  },
  cues: VITAMIN_C_CUES,
  evidence: VITAMIN_C_EVIDENCE,
  uncertaintyLines: [
    "Effect on duration is small (~8%) and depends on dose and timing.",
    "Most data is for healthy adults; high-stress populations show different effects.",
    "Self-reported cold severity introduces measurement noise.",
  ],
  noteText:
    "Watch how 'prevents' and 'shortens' are used interchangeably — the difference is most of the verdict.",
  summaryText:
    'TrustTrace check: "Vitamin C prevents common colds"\n\nVerdict: Sources support a smaller claim than the one being made.\nEvidence: 4 sources · 3 independent · 1 primary · 1 snippet-only\nUncertainty: med',
};

const HANDWRITTEN_NOTES_CUES: readonly CredibilityCue[] = [
  {
    name: "Sample size and replication",
    text: "The 65% figure traces to a single 2014 study; replication attempts found smaller or null effects.",
    note: "One study × shaky replication = weak signal.",
    strength: 2,
    tooltip:
      "Single studies, especially psychology lab studies, often fail to replicate. Specific numerical claims (65%) sourced to one paper deserve extra skepticism.",
  },
  {
    name: "Number transmission",
    text: "Popular write-ups round and re-round the original effect size; the '65%' has drifted from the source's actual reported effect.",
    note: "Statistics decay through citation chains.",
    strength: 2,
    tooltip:
      "Each layer of summarization simplifies the original measurement. Numbers that travel far from the primary source are usually wrong.",
  },
  {
    name: "Source authority",
    text: "Original paper is peer-reviewed but has been openly questioned by replication efforts in the same field.",
    note: "Peer review ≠ settled science.",
    strength: 3,
    tooltip:
      "Peer review filters egregious errors but does not guarantee findings hold up in follow-up studies.",
  },
] as const;

const HANDWRITTEN_NOTES_EVIDENCE: readonly EvidenceItem[] = [
  {
    sourceName: "psychologicalscience.org",
    domain: "journals.sagepub.com",
    credibilityLabel: "EDU",
    date: "2014",
    title: "The Pen Is Mightier Than the Keyboard",
    text: "Mueller & Oppenheimer report better conceptual recall for handwritten notetakers in three lab studies; effect sizes vary across conditions.",
    url: "https://journals.sagepub.com/doi/10.1177/0956797614524581",
    relation: "supports",
    tier: 1,
    scopeMatch: 0.7,
  },
  {
    sourceName: "psychologicalscience.org",
    domain: "journals.sagepub.com",
    credibilityLabel: "EDU",
    date: "2021",
    title: "Don't Throw Away Your Printed Books — A Replication of Mueller & Oppenheimer",
    text: "Pre-registered replication finds no significant overall difference in conceptual recall between handwritten and laptop notes.",
    url: "https://journals.sagepub.com/doi/10.1177/0956797620965541",
    relation: "contradicts",
    tier: 1,
    scopeMatch: 0.85,
  },
  {
    sourceName: "education week",
    domain: "edweek.org",
    credibilityLabel: "ORG",
    date: "2023",
    title: "What the Research Actually Says About Note-Taking",
    text: "Coverage commonly cites the original Mueller study without acknowledging failed replications, treating the 65% number as established.",
    url: "https://www.edweek.org/teaching-learning/note-taking-research/2023/05",
    relation: "neutral",
    tier: 3,
    scopeMatch: 0.6,
  },
] as const;

const HANDWRITTEN_NOTES_RESULT: CheckResultViewModel = {
  checkId: "demo-handwritten-notes",
  inputText: "Students retain 65% more info from handwritten notes",
  inputTypeLabel: "text input",
  durationLabel: "7.1s",
  verdictBand: "evidence_weak",
  verdictLabel: "evidence weak",
  headline: "The headline number traces to one study with shaky replication.",
  description:
    "The original 2014 study reports a smaller, condition-dependent effect; a pre-registered replication finds no overall benefit. The cited 65% does not match either.",
  atAGlance: {
    evidence: 3,
    independent: 2,
    fullText: 3,
    primary: 2,
    snippet: 0,
    uncertainty: "high",
  },
  cues: HANDWRITTEN_NOTES_CUES,
  evidence: HANDWRITTEN_NOTES_EVIDENCE,
  uncertaintyLines: [
    "The original study used short lab tasks, not real coursework.",
    "Replication results vary; effect direction is not stable across labs.",
    "The specific 65% figure is not directly supported by either the original or replication paper.",
  ],
  noteText:
    "Round numbers in popular claims usually didn't come from the original paper. Trace the citation chain back to its source before trusting the magnitude.",
  summaryText:
    'TrustTrace check: "Students retain 65% more info from handwritten notes"\n\nVerdict: The headline number traces to one study with shaky replication.\nEvidence: 3 sources · 2 independent · 2 primary · 0 snippet-only\nUncertainty: high',
};

const AI_DANGEROUS_CUES: readonly CredibilityCue[] = [
  {
    name: "Claim specificity",
    text: "The claim does not name a system, a harm, or a timeframe — three different framings (autonomous weapons, labor displacement, existential risk) draw on disjoint evidence.",
    note: "Vague verbs hide which evidence applies.",
    strength: 1,
    tooltip:
      "When a claim leaves the subject and outcome implicit, every reader fills in different blanks. The disagreement is about which claim, not whether it's true.",
  },
  {
    name: "Source disagreement",
    text: "Surveyed researchers, regulators, and industry leaders publicly disagree on which AI harms are most pressing — concentration of power, misinformation, bias, autonomous-weapons risk, or long-horizon catastrophic risk.",
    note: "Domain experts split on category, not just magnitude.",
    strength: 3,
    tooltip:
      "Where qualified experts disagree on which harm matters most, a single yes/no verdict misrepresents the state of knowledge. Surfacing the disagreement is more honest.",
  },
  {
    name: "Definitional drift",
    text: "'AI' covers narrow ML systems already deployed and hypothetical general systems that don't exist; the literature treats them as distinct objects.",
    note: "One word, two referents.",
    strength: 2,
    tooltip:
      "When a claim's subject shifts between a deployed technology and a hypothetical one, evidence about either shouldn't be merged into a single verdict.",
  },
] as const;

const AI_DANGEROUS_EVIDENCE: readonly EvidenceItem[] = [
  {
    sourceName: "stanford.edu",
    domain: "aiindex.stanford.edu",
    credibilityLabel: "EDU",
    date: "2025",
    title: "AI Index Report — Public Concern and Expert Survey",
    text: "Surveyed AI researchers split on which AI risks rank highest; majority concern centers on misuse and concentration of power, not autonomous-system takeover.",
    url: "https://aiindex.stanford.edu/report/",
    relation: "neutral",
    tier: 2,
    scopeMatch: 0.55,
  },
  {
    sourceName: "nist.gov",
    domain: "nist.gov",
    credibilityLabel: "GOV",
    date: "2024",
    title: "AI Risk Management Framework",
    text: "Categorizes harms as bias, privacy, security, safety, transparency — explicitly notes that 'risk' must be tied to a specific system and use context.",
    url: "https://www.nist.gov/itl/ai-risk-management-framework",
    relation: "neutral",
    tier: 1,
    scopeMatch: 0.65,
  },
  {
    sourceName: "weforum.org",
    domain: "weforum.org",
    credibilityLabel: "INT'L",
    date: "2025",
    title: "Global Risks Report — AI-Related Risks",
    text: "Lists AI-driven misinformation as a top short-term global risk; longer-horizon AI risks remain contested across surveyed experts.",
    url: "https://www.weforum.org/reports/global-risks-report-2025/",
    relation: "neutral",
    tier: 2,
    scopeMatch: 0.5,
  },
] as const;

const AI_DANGEROUS_RESULT: CheckResultViewModel = {
  checkId: "demo-ai-dangerous",
  inputText: "AI is dangerous",
  inputTypeLabel: "text input",
  durationLabel: "5.6s",
  verdictBand: "needs_context",
  verdictLabel: "needs context",
  headline: "Too broad to verify. The verdict depends on which AI and which harm.",
  description:
    "Sources do not cleanly support or contradict the claim because the claim does not specify a system, a harm, or a timeframe. Different framings draw on disjoint evidence and reach different conclusions.",
  atAGlance: {
    evidence: 3,
    independent: 3,
    fullText: 3,
    primary: 0,
    snippet: 0,
    uncertainty: "high",
  },
  cues: AI_DANGEROUS_CUES,
  evidence: AI_DANGEROUS_EVIDENCE,
  uncertaintyLines: [
    "The unstated subject (which systems) drives most of the verdict variation.",
    "Surveyed experts split on category of harm, not only on magnitude.",
    "Short-horizon risks (misinformation, bias) are better measured than long-horizon ones.",
  ],
  noteText:
    "When a claim is broad enough to be true under one reading and false under another, the claim — not the evidence — is the thing to fix. Ask which system and which harm before re-running.",
  summaryText:
    'TrustTrace check: "AI is dangerous"\n\nVerdict: Too broad to verify — depends on which AI and which harm.\nEvidence: 3 sources · 3 independent · 0 primary · 0 snippet-only\nUncertainty: high',
};

export const RESULT_BY_CHECK_ID: Record<string, CheckResultViewModel> = {
  "demo-seat-belts": CHECK_RESULT,
  "demo-vitamin-c-colds": VITAMIN_C_RESULT,
  "demo-handwritten-notes": HANDWRITTEN_NOTES_RESULT,
  "demo-ai-dangerous": AI_DANGEROUS_RESULT,
};

export const FALLBACK_RESULT: CheckResultViewModel = CHECK_RESULT;
