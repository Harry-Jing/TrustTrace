export type EvidenceRelation = "supports" | "contradicts" | "neutral";

export type EvidenceTier = 1 | 2 | 3 | 4;

export interface EvidenceItem {
  sourceName: string;
  domain: string;
  credibilityLabel: string;
  date: string;
  title: string;
  text: string;
  url: string;
  relation: EvidenceRelation;
  tier: EvidenceTier;
  scopeMatch: number;
  clusterId?: string;
}
