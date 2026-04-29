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

const COFFEE_LIFESPAN_CUES: readonly CredibilityCue[] = [
  {
    name: "Cross-source consistency",
    text: "Multiple large cohort studies independently find moderate coffee intake associated with neutral or slightly lower mortality, contradicting the headline.",
    note: "Independent cohorts converge against the claim.",
    strength: 5,
    tooltip:
      "When several independent populations show the same pattern, single contrarian claims face a high bar to overturn the consensus.",
  },
  {
    name: "Source authority",
    text: "Strongest evidence comes from peer-reviewed cohort studies and meta-analyses, not editorial or wellness-blog framing.",
    note: "Authority outweighs viral framing here.",
    strength: 5,
    tooltip:
      "Peer-reviewed cohort data with millions of participant-years is more reliable than viral headlines drawing from individual case reports.",
  },
  {
    name: "Effect direction",
    text: "Mainstream evidence is neutral-to-positive for moderate intake; the '3 years shorter' claim has no recognizable source in the literature.",
    note: "Numbers without provenance are red flags.",
    strength: 4,
    tooltip:
      "When a specific quantitative claim cannot be traced to any source, that's a strong signal it was invented or misattributed.",
  },
] as const;

const COFFEE_LIFESPAN_EVIDENCE: readonly EvidenceItem[] = [
  {
    sourceName: "nejm.org",
    domain: "nejm.org",
    credibilityLabel: "EDU",
    date: "2022",
    title: "Coffee Consumption and Mortality — NEJM Cohort",
    text: "In a 14-year cohort of >400 000 adults, moderate coffee intake (2–4 cups/day) is associated with a small reduction in all-cause mortality.",
    url: "https://www.nejm.org/doi/full/10.1056/NEJMoa1112010",
    relation: "contradicts",
    tier: 1,
    scopeMatch: 0.9,
  },
  {
    sourceName: "annals.org",
    domain: "annals.org",
    credibilityLabel: "EDU",
    date: "2023",
    title: "Coffee Drinking and Mortality in 10 European Countries",
    text: "Higher coffee consumption is associated with lower mortality from various causes across 10 European cohorts.",
    url: "https://www.acpjournals.org/doi/10.7326/M16-2945",
    relation: "contradicts",
    tier: 1,
    scopeMatch: 0.85,
  },
  {
    sourceName: "who.int",
    domain: "iarc.who.int",
    credibilityLabel: "INT'L",
    date: "2024",
    title: "Coffee, mate, and very hot beverages — IARC Monograph",
    text: "Coffee itself is not classifiable as carcinogenic; risks identified are tied to drinking beverages at very high temperatures, not coffee per se.",
    url: "https://monographs.iarc.who.int/wp-content/uploads/2018/06/mono116.pdf",
    relation: "contradicts",
    tier: 2,
    scopeMatch: 0.6,
  },
] as const;

const COFFEE_LIFESPAN_RESULT: CheckResultViewModel = {
  checkId: "demo-coffee-lifespan",
  inputText: "Coffee shortens lifespan by 3 years",
  inputTypeLabel: "text input",
  durationLabel: "5.9s",
  verdictBand: "evidence_strong",
  verdictLabel: "evidence strong",
  headline: "Major cohorts contradict the claim. The number has no traceable source.",
  description:
    "Large peer-reviewed cohort studies repeatedly associate moderate coffee intake with neutral or slightly lower mortality. The specific '3 years shorter' figure does not appear in the primary literature.",
  atAGlance: {
    evidence: 3,
    independent: 3,
    fullText: 3,
    primary: 2,
    snippet: 0,
    uncertainty: "low",
  },
  cues: COFFEE_LIFESPAN_CUES,
  evidence: COFFEE_LIFESPAN_EVIDENCE,
  uncertaintyLines: [
    "Effects vary by intake level; very high intake (>6 cups/day) is less well studied.",
    "Confounding by lifestyle factors is partially controlled but not eliminated.",
    "Decaffeinated coffee shows similar associations, complicating mechanistic interpretation.",
  ],
  noteText:
    "Strong specific numbers ('3 years') are easy to repeat and hard to source. When a number can't be traced, treat it as folklore until a primary study turns up.",
  summaryText:
    'TrustTrace check: "Coffee shortens lifespan by 3 years"\n\nVerdict: Major cohorts contradict the claim.\nEvidence: 3 sources · 3 independent · 2 primary · 0 snippet-only\nUncertainty: low',
};

const EV_BATTERIES_CUES: readonly CredibilityCue[] = [
  {
    name: "Scope sensitivity",
    text: "Lifecycle results depend strongly on the electricity grid mix powering the EV — renewable grids produce very different totals than coal-heavy grids.",
    note: "The same claim is true and false depending on region.",
    strength: 3,
    tooltip:
      "When a quantitative claim's truth depends on context (geography, time, grid composition), a single yes/no answer hides the actual finding.",
  },
  {
    name: "Source authority",
    text: "Strongest evidence comes from peer-reviewed lifecycle assessments; advocacy framing on either side often quotes only one grid scenario.",
    note: "LCA papers > advocacy summaries.",
    strength: 4,
    tooltip:
      "Lifecycle assessments are detailed studies of cradle-to-grave emissions. Advocacy summaries cherry-pick the scenarios that support a position.",
  },
  {
    name: "Effect direction",
    text: "Most modern LCAs find EVs lower lifecycle emissions than gas cars in nearly all major markets; only specific edge cases reverse the comparison.",
    note: "Edge cases ≠ central finding.",
    strength: 4,
    tooltip:
      "It's possible to construct scenarios where EVs underperform gas cars, but those scenarios don't represent typical use.",
  },
] as const;

const EV_BATTERIES_EVIDENCE: readonly EvidenceItem[] = [
  {
    sourceName: "iea.org",
    domain: "iea.org",
    credibilityLabel: "INT'L",
    date: "2024",
    title: "Global EV Outlook — Lifecycle Emissions",
    text: "Across most major markets, EVs produce lower lifecycle greenhouse gas emissions than ICE vehicles, even accounting for battery manufacturing.",
    url: "https://www.iea.org/reports/global-ev-outlook-2024",
    relation: "contradicts",
    tier: 1,
    scopeMatch: 0.85,
  },
  {
    sourceName: "transportenvironment.org",
    domain: "transportenvironment.org",
    credibilityLabel: "ORG",
    date: "2024",
    title: "How clean are electric cars?",
    text: "T&E lifecycle modeling finds EVs cut lifetime CO₂ by 60–80% in EU grids, with smaller advantages in coal-heavy regions but rarely a reversal.",
    url: "https://www.transportenvironment.org/discover/how-clean-are-electric-cars/",
    relation: "contradicts",
    tier: 2,
    scopeMatch: 0.8,
  },
  {
    sourceName: "mit.edu",
    domain: "climate.mit.edu",
    credibilityLabel: "EDU",
    date: "2023",
    title: "Are electric vehicles definitely better for the climate?",
    text: "EV lifecycle emissions exceed ICE vehicles only in a narrow set of scenarios — short vehicle lifespan combined with very carbon-intensive electricity.",
    url: "https://climate.mit.edu/ask-mit/are-electric-vehicles-definitely-better-climate-gas-powered-cars",
    relation: "neutral",
    tier: 1,
    scopeMatch: 0.75,
  },
] as const;

const EV_BATTERIES_RESULT: CheckResultViewModel = {
  checkId: "demo-ev-batteries",
  inputText: "EV batteries pollute more than gas cars over lifetime",
  inputTypeLabel: "text input",
  durationLabel: "8.2s",
  verdictBand: "evidence_mixed",
  verdictLabel: "evidence mixed",
  headline: "True only in narrow scenarios. Misleading as a general statement.",
  description:
    "Most lifecycle assessments find EVs lower lifetime emissions in nearly every major market. The general claim only holds when grid carbon intensity is very high and vehicle life is very short.",
  atAGlance: {
    evidence: 3,
    independent: 3,
    fullText: 3,
    primary: 2,
    snippet: 0,
    uncertainty: "med",
  },
  cues: EV_BATTERIES_CUES,
  evidence: EV_BATTERIES_EVIDENCE,
  uncertaintyLines: [
    "Battery manufacturing emissions vary by chemistry and supplier.",
    "Grid mix changes over a vehicle's life — newer EVs benefit from grid decarbonization.",
    "End-of-life battery recycling is improving but data on field performance is sparse.",
  ],
  noteText:
    "When a claim is true under some conditions and false under others, the question is which conditions describe the real world. Here, the typical-case answer reverses the headline.",
  summaryText:
    'TrustTrace check: "EV batteries pollute more than gas cars over lifetime"\n\nVerdict: True only in narrow scenarios.\nEvidence: 3 sources · 3 independent · 2 primary · 0 snippet-only\nUncertainty: med',
};

const DIM_LIGHT_EYES_CUES: readonly CredibilityCue[] = [
  {
    name: "Mechanistic implausibility",
    text: "There is no known mechanism by which transient eyestrain causes permanent retinal or refractive damage from low ambient light.",
    note: "Mechanism is the missing piece.",
    strength: 4,
    tooltip:
      "Plausible biological mechanisms strengthen claims. Their absence — combined with no observational evidence — usually marks a folk myth.",
  },
  {
    name: "Cross-source consistency",
    text: "Major ophthalmology bodies independently classify this as a myth and distinguish reversible eyestrain from permanent damage.",
    note: "Bodies agree, claim is folklore.",
    strength: 5,
    tooltip:
      "When professional bodies across countries explicitly identify a claim as a myth, that's a strong signal the popular understanding is incorrect.",
  },
] as const;

const DIM_LIGHT_EYES_EVIDENCE: readonly EvidenceItem[] = [
  {
    sourceName: "aao.org",
    domain: "aao.org",
    credibilityLabel: "ORG",
    date: "2023",
    title: "Does Reading in Dim Light Hurt Your Eyes?",
    text: "Reading in dim light causes temporary eyestrain — fatigue, dryness — but does not permanently damage vision.",
    url: "https://www.aao.org/eye-health/tips-prevention/reading-low-light",
    relation: "contradicts",
    tier: 1,
    scopeMatch: 0.95,
  },
  {
    sourceName: "harvard.edu",
    domain: "health.harvard.edu",
    credibilityLabel: "EDU",
    date: "2024",
    title: "Will Reading in Low Light Damage My Eyes?",
    text: "There's no evidence that low-light reading causes permanent harm. Symptoms fade once lighting improves.",
    url: "https://www.health.harvard.edu/blog/will-reading-in-low-light-damage-my-eyes",
    relation: "contradicts",
    tier: 1,
    scopeMatch: 0.9,
  },
] as const;

const DIM_LIGHT_EYES_RESULT: CheckResultViewModel = {
  checkId: "demo-dim-light-eyesight",
  inputText: "Reading in dim light permanently damages eyesight",
  inputTypeLabel: "text input",
  durationLabel: "4.7s",
  verdictBand: "evidence_strong",
  verdictLabel: "evidence strong",
  headline: "Folk myth. Sources contradict it cleanly.",
  description:
    "Ophthalmology bodies independently distinguish reversible eyestrain from permanent damage and explicitly classify this claim as a myth. There is no proposed mechanism for permanent harm.",
  atAGlance: {
    evidence: 2,
    independent: 2,
    fullText: 2,
    primary: 0,
    snippet: 0,
    uncertainty: "low",
  },
  cues: DIM_LIGHT_EYES_CUES,
  evidence: DIM_LIGHT_EYES_EVIDENCE,
  uncertaintyLines: [
    "Long-term cohort studies on dim-light reading specifically are sparse — but the claim's mechanism is also implausible.",
    "Eyestrain is real and can be uncomfortable; that experience is often misread as 'damage'.",
  ],
  noteText:
    "Familiar discomfort gets reinterpreted as harm. Distinguishing reversible symptoms from permanent change is the core skill the body of sources is teaching.",
  summaryText:
    'TrustTrace check: "Reading in dim light permanently damages eyesight"\n\nVerdict: Folk myth. Sources contradict it cleanly.\nEvidence: 2 sources · 2 independent · 0 primary · 0 snippet-only\nUncertainty: low',
};

export const RESULT_BY_CHECK_ID: Record<string, CheckResultViewModel> = {
  "demo-seat-belts": CHECK_RESULT,
  "demo-vitamin-c-colds": VITAMIN_C_RESULT,
  "demo-handwritten-notes": HANDWRITTEN_NOTES_RESULT,
  "demo-coffee-lifespan": COFFEE_LIFESPAN_RESULT,
  "demo-ev-batteries": EV_BATTERIES_RESULT,
  "demo-dim-light-eyesight": DIM_LIGHT_EYES_RESULT,
};

export const FALLBACK_RESULT: CheckResultViewModel = CHECK_RESULT;
