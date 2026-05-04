import { z } from "zod";

import type { QueryPlanDto } from "../types/claim";

export const queryPlanSchema: z.ZodType<QueryPlanDto> = z.object({
  neutral: z.array(z.string().min(1)).default([]),
  authority: z.array(z.string().min(1)).default([]),
  challenge: z.array(z.string().min(1)).default([]),
});

export const claimAnalysisResponseSchema = z.object({
  mainClaim: z.string().min(1),
  claimType: z.enum([
    "factual",
    "statistical",
    "causal",
    "quote",
    "prediction",
    "comparison",
    "other",
  ]),
  domain: z.enum(["health", "science", "politics", "product", "legal", "finance", "general"]),
  temporalScope: z.string().nullable(),
  geographicScope: z.string().nullable(),
  ambiguityNotes: z.array(z.string()).default([]),
  queryPlan: queryPlanSchema,
});

export const discoveryResponseSchema = z.object({
  candidates: z.array(
    z.object({
      url: z.string().min(1),
      title: z.string().nullable(),
      snippet: z.string().nullable().optional(),
    }),
  ),
});

export const assessmentResponseSchema = z.object({
  assessments: z.array(
    z.object({
      sourceUrl: z.string().min(1),
      relation: z.enum(["supports", "contradicts", "neutral"]),
      scopeMatch: z.number().min(0).max(1),
      credibilityLabel: z.string().min(1),
      isPrimary: z.boolean(),
      rationale: z.string().min(1),
      evidenceText: z.string().min(1),
    }),
  ),
});

export const resultCopyResponseSchema = z.object({
  headline: z.string().min(1),
  description: z.string().min(1),
  uncertaintyLines: z.array(z.string().min(1)).min(1).max(4),
  noteText: z.string().min(1),
  summaryText: z.string().min(1),
});

export type ClaimAnalysisResponse = z.infer<typeof claimAnalysisResponseSchema>;
export type DiscoveryResponse = z.infer<typeof discoveryResponseSchema>;
export type AssessmentResponse = z.infer<typeof assessmentResponseSchema>;
export type ResultCopyResponse = z.infer<typeof resultCopyResponseSchema>;
