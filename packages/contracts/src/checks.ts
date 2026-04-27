import { z } from "zod";

export const checkStatusSchema = z.enum(["queued", "running", "completed", "failed"]);

export const checkPhaseSchema = z.enum([
  "understanding",
  "strategy",
  "discovery",
  "verify_read",
  "weigh",
  "verdict",
  "completed",
  "failed",
]);

export const finiteNumberSchema = z.number().refine(Number.isFinite, "Expected a finite number");
export const nonNegativeIntegerSchema = z.number().int().min(0);
export const percentSchema = z.number().int().min(0).max(100);
export const isoStringSchema = z.iso.datetime();

export const nullableStringSchema = z
  .string()
  .nullable()
  .optional()
  .transform((value) => value ?? null);

export const httpUrlSchema = z.string().refine(isHttpUrl, "Expected an absolute http(s) URL.");

export const checkInputSchema = z.object({
  type: z.enum(["text", "url"]),
  content: z.string().min(1),
});

export const createCheckRequestSchema = z
  .object({
    input: z.object({
      type: z.enum(["text", "url"]),
      content: z.string(),
    }),
  })
  .transform((body) => ({
    input: {
      type: body.input.type,
      content: body.input.content.trim(),
    },
  }))
  .superRefine((body, ctx) => {
    if (body.input.type === "text") {
      if (body.input.content.length < 3) {
        ctx.addIssue({
          code: "custom",
          path: ["input", "content"],
          message: "Text checks must be at least 3 characters.",
        });
      }
      if (body.input.content.length > 10000) {
        ctx.addIssue({
          code: "custom",
          path: ["input", "content"],
          message: "Text checks must be 10,000 characters or fewer.",
        });
      }
      return;
    }

    if (!isHttpUrl(body.input.content)) {
      ctx.addIssue({
        code: "custom",
        path: ["input", "content"],
        message: "URL checks must use an absolute http(s) URL.",
      });
    }
  });

export const checkApiErrorSchema = z.object({
  code: z.string().min(1),
  category: z.string().min(1),
  message: z.string().min(1),
  retryable: z.boolean(),
  traceId: nullableStringSchema,
  occurredAt: isoStringSchema,
});

export const checkProgressSchema = z.object({
  checkId: z.string().min(1),
  status: checkStatusSchema,
  phase: checkPhaseSchema,
  percent: percentSchema,
  message: z.string().min(1),
  eventSeq: nonNegativeIntegerSchema,
  updatedAt: isoStringSchema,
});

export const evidenceItemSchema = z.object({
  sourceName: z.string().min(1),
  domain: z.string().min(1),
  credibilityLabel: z.string(),
  date: z.string(),
  title: z.string().min(1),
  text: z.string().min(1),
  url: httpUrlSchema,
  relation: z.enum(["supports", "contradicts", "neutral"]),
  tier: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  scopeMatch: finiteNumberSchema.min(0).max(1),
  clusterId: z.string().optional(),
});

export const resultAtAGlanceSchema = z.object({
  evidence: nonNegativeIntegerSchema,
  independent: nonNegativeIntegerSchema,
  fullText: nonNegativeIntegerSchema,
  primary: nonNegativeIntegerSchema,
  snippet: nonNegativeIntegerSchema,
  uncertainty: z.enum(["low", "med", "high"]),
});

export const credibilityCueSchema = z.object({
  name: z.string().min(1),
  text: z.string().min(1),
  note: z.string(),
  strength: finiteNumberSchema.min(0).max(5),
  tooltip: z.string().min(1),
});

export const checkResultSchema = z.object({
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
  verdictLabel: z.string(),
  headline: z.string(),
  description: z.string(),
  atAGlance: resultAtAGlanceSchema,
  cues: z.array(credibilityCueSchema),
  evidence: z.array(evidenceItemSchema),
  uncertaintyLines: z.array(z.string()),
  noteText: z.string(),
  summaryText: z.string(),
});

export const createCheckResponseSchema = z.object({
  checkId: z.string().min(1),
  status: checkStatusSchema,
  progress: checkProgressSchema,
  eventsUrl: z.string().min(1),
  createdAt: isoStringSchema,
});

export const checkRecordSchema = z
  .object({
    checkId: z.string().min(1),
    status: checkStatusSchema,
    input: checkInputSchema.nullish().transform((value) => value ?? null),
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

export const checkListItemSchema = z.object({
  checkId: z.string().min(1),
  claim: z.string(),
  snippet: z.string(),
  createdAt: isoStringSchema,
  cue: z.string(),
  tone: z.enum(["default", "accent", "warn", "good", "dark"]),
});

export const checkListResponseSchema = z.object({
  items: z.array(checkListItemSchema),
});

export const progressEventSchema = z.object({
  seq: nonNegativeIntegerSchema,
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

export type CheckStatusDto = z.infer<typeof checkStatusSchema>;
export type CheckPhaseDto = z.infer<typeof checkPhaseSchema>;
export type CheckInputDto = z.infer<typeof checkInputSchema>;
export type CreateCheckRequestDto = z.infer<typeof createCheckRequestSchema>;
export type CheckApiErrorDto = z.infer<typeof checkApiErrorSchema>;
export type CheckProgressDto = z.infer<typeof checkProgressSchema>;
export type EvidenceItemDto = z.infer<typeof evidenceItemSchema>;
export type ResultAtAGlanceDto = z.infer<typeof resultAtAGlanceSchema>;
export type CredibilityCueDto = z.infer<typeof credibilityCueSchema>;
export type CheckResultDto = z.infer<typeof checkResultSchema>;
export type CreateCheckResponseDto = z.infer<typeof createCheckResponseSchema>;
export type CheckRecordDto = z.infer<typeof checkRecordSchema>;
export type CheckListItemDto = z.infer<typeof checkListItemSchema>;
export type CheckListResponseDto = z.infer<typeof checkListResponseSchema>;
export type ProgressEventDto = z.infer<typeof progressEventSchema>;

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
