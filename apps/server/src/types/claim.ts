export type ClaimType =
  | "factual"
  | "statistical"
  | "causal"
  | "quote"
  | "prediction"
  | "comparison"
  | "other";

export type ClaimDomain =
  | "health"
  | "science"
  | "politics"
  | "product"
  | "legal"
  | "finance"
  | "general";

export interface QueryPlanDto {
  neutral: string[];
  authority: string[];
  challenge: string[];
}

export interface ClaimAnalysisDto {
  checkId: string;
  mainClaim: string;
  claimType: ClaimType;
  domain: ClaimDomain;
  temporalScope: string | null;
  geographicScope: string | null;
  ambiguityNotes: string[];
  queryPlan: QueryPlanDto;
  createdAt: string;
  updatedAt: string;
}
