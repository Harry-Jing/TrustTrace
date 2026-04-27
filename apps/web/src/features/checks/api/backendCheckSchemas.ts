import { z } from "zod";

import { readVerdictCopy } from "@/features/checks/constants/resultFallbacks";
import type {
  CheckApiError,
  EvidenceItem,
  CheckInputDraft,
  CheckListItem,
  CheckProgress,
  CheckRecord,
  CheckResultViewModel,
  CreateCheckResponse,
  ProgressEvent,
} from "@/features/checks/types";
import { isSafeHttpUrl } from "@/features/checks/utils";

const checkStatusSchema = z.enum(["queued", "running", "completed", "failed"]);
const checkPhaseSchema = z.enum([
  "understanding",
  "strategy",
  "discovery",
  "verify_read",
  "weigh",
  "verdict",
  "completed",
  "failed",
]);

const finiteNumberSchema = z.number().refine(Number.isFinite, "Expected a finite number");
const percentSchema = finiteNumberSchema.min(0).max(100);
const isoStringSchema = z.string().min(1);
const nullableStringSchema = z
  .string()
  .nullable()
  .optional()
  .transform((value) => value ?? null);

const checkInputDtoSchema = z
  .object({
    type: z.enum(["text", "url"]),
    content: z.string().min(1),
  })
  .transform(
    (input): CheckInputDraft => ({
      mode: input.type,
      value: input.content,
    }),
  );

const checkApiErrorSchema: z.ZodType<CheckApiError> = z.object({
  code: z.string().min(1),
  category: z.string().min(1),
  message: z.string().min(1),
  retryable: z.boolean(),
  traceId: nullableStringSchema,
  occurredAt: isoStringSchema,
});

const checkProgressSchema: z.ZodType<CheckProgress> = z.object({
  checkId: z.string().min(1),
  status: checkStatusSchema,
  phase: checkPhaseSchema,
  percent: percentSchema,
  message: z.string().min(1),
  eventSeq: finiteNumberSchema.min(0),
  updatedAt: isoStringSchema,
});

const evidenceItemSchema: z.ZodType<EvidenceItem> = z
  .object({
    sourceName: z.string().min(1),
    domain: z.string().min(1),
    credibilityLabel: z.string(),
    date: z.string(),
    title: z.string().min(1),
    text: z.string().min(1),
    url: z.string().refine(isSafeHttpUrl, "Evidence URL must be absolute http(s)."),
    relation: z.enum(["supports", "contradicts", "neutral"]),
    tier: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
    scopeMatch: finiteNumberSchema.min(0).max(1),
    clusterId: z.string().optional(),
  })
  .transform((item): EvidenceItem => {
    const { clusterId, ...evidence } = item;
    return clusterId === undefined ? evidence : { ...evidence, clusterId };
  });

const resultAtAGlanceSchema = z.object({
  evidence: finiteNumberSchema.min(0),
  independent: finiteNumberSchema.min(0),
  fullText: finiteNumberSchema.min(0),
  primary: finiteNumberSchema.min(0),
  snippet: finiteNumberSchema.min(0),
  uncertainty: z.enum(["low", "med", "high"]),
});

const credibilityCueSchema = z.object({
  name: z.string().min(1),
  text: z.string().min(1),
  note: z.string(),
  strength: finiteNumberSchema.min(0).max(5),
  tooltip: z.string().min(1),
});

const checkResultSchema = z
  .object({
    checkId: z.string().min(1),
    inputText: z.string(),
    inputTypeLabel: z.string(),
    durationLabel: z.string(),
    verdictBand: z.enum([
      "evidence_strong",
      "evidence_mixed",
      "evidence_weak",
      "evidence_thin",
      "needs_context",
      "system_failed",
    ]),
    verdictLabel: z.string().optional().default(""),
    headline: z.string().optional().default(""),
    description: z.string().optional().default(""),
    atAGlance: resultAtAGlanceSchema,
    cues: z.array(credibilityCueSchema),
    evidence: z.array(evidenceItemSchema),
    uncertaintyLines: z.array(z.string()),
    noteText: z.string(),
    summaryText: z.string(),
  })
  .transform(
    (result): CheckResultViewModel => ({
      ...result,
      verdictLabel: readVerdictCopy(result.verdictBand, "label", result.verdictLabel),
      headline: readVerdictCopy(result.verdictBand, "headline", result.headline),
      description: readVerdictCopy(result.verdictBand, "description", result.description),
    }),
  );

export const createCheckResponseSchema: z.ZodType<CreateCheckResponse> = z.object({
  checkId: z.string().min(1),
  status: checkStatusSchema,
  progress: checkProgressSchema,
  eventsUrl: z.string().min(1),
  createdAt: isoStringSchema,
});

export const checkRecordSchema: z.ZodType<CheckRecord> = z
  .object({
    checkId: z.string().min(1),
    status: checkStatusSchema,
    input: checkInputDtoSchema.nullish().transform((value) => value ?? null),
    progress: checkProgressSchema,
    result: checkResultSchema.nullable(),
    error: checkApiErrorSchema.nullable(),
    createdAt: isoStringSchema,
    updatedAt: isoStringSchema,
    completedAt: nullableStringSchema,
  })
  .superRefine((record, ctx) => {
    if (record.status === "completed" && !record.result) {
      ctx.addIssue({
        code: "custom",
        path: ["result"],
        message: "Completed checks must include a result.",
      });
    }
  });

const checkListItemSchema: z.ZodType<CheckListItem> = z.object({
  checkId: z.string().min(1),
  claim: z.string(),
  snippet: z.string(),
  createdAt: isoStringSchema,
  cue: z.string(),
  tone: z.enum(["default", "accent", "warn", "good", "dark"]),
});

export const checkListResponseSchema = z
  .union([
    z.array(checkListItemSchema),
    z.object({ items: z.array(checkListItemSchema) }),
    z.object({ checks: z.array(checkListItemSchema) }),
    z.object({ recent: z.array(checkListItemSchema) }),
  ])
  .transform((value): readonly CheckListItem[] => {
    if (Array.isArray(value)) return value;
    if ("items" in value) return value.items;
    if ("checks" in value) return value.checks;
    return value.recent;
  });

export const progressEventSchema: z.ZodType<ProgressEvent> = z.object({
  seq: finiteNumberSchema.min(0),
  checkId: z.string().min(1),
  status: checkStatusSchema,
  phase: checkPhaseSchema,
  percent: percentSchema,
  message: z.string().min(1),
  provider: nullableStringSchema,
  stepCode: nullableStringSchema,
  error: checkApiErrorSchema
    .nullable()
    .optional()
    .transform((value) => value ?? null),
  createdAt: isoStringSchema,
});

export class BackendContractError extends Error {
  constructor(context: string, error: z.ZodError) {
    const details = error.issues
      .map((issue) => `${issue.path.join(".") || "<root>"}: ${issue.message}`)
      .join("; ");
    super(`Backend contract violation in ${context}: ${details}`);
    this.name = "BackendContractError";
  }
}

export function parseBackendPayload<T>(schema: z.ZodType<T>, value: unknown, context: string): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    throw new BackendContractError(context, parsed.error);
  }

  return parsed.data;
}
