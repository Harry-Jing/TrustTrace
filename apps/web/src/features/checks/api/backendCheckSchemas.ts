import {
  checkListResponseSchema as checkListResponseDtoSchema,
  checkRecordSchema as checkRecordDtoSchema,
  createCheckResponseSchema,
  progressEventSchema,
  type CheckInputDto,
  type CheckRecordDto,
  type CheckResultDto,
  type EvidenceItemDto,
} from "@trusttrace/contracts/checks";

import { readVerdictCopy } from "@/features/checks/constants/resultFallbacks";
import type {
  CheckInputDraft,
  CheckListItem,
  CheckRecord,
  CheckResultViewModel,
  EvidenceItem,
} from "@/features/checks/types";

interface ParseIssue {
  path: readonly PropertyKey[];
  message: string;
}

interface ParseErrorLike {
  issues: readonly ParseIssue[];
}

type ParseResult<T> = { success: true; data: T } | { success: false; error: ParseErrorLike };

interface ParseableSchema<T> {
  safeParse(value: unknown): ParseResult<T>;
}

export { createCheckResponseSchema, progressEventSchema };

export const checkRecordSchema = checkRecordDtoSchema.transform(mapCheckRecord);

export const checkListResponseSchema = checkListResponseDtoSchema.transform(
  (response): readonly CheckListItem[] => response.items,
);

export class BackendContractError extends Error {
  constructor(context: string, error: ParseErrorLike) {
    const details = error.issues
      .map((issue) => `${formatIssuePath(issue.path)}: ${issue.message}`)
      .join("; ");
    super(`Backend contract violation in ${context}: ${details}`);
    this.name = "BackendContractError";
  }
}

export function parseBackendPayload<T>(
  schema: ParseableSchema<T>,
  value: unknown,
  context: string,
): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    throw new BackendContractError(context, parsed.error);
  }

  return parsed.data;
}

function mapCheckRecord(record: CheckRecordDto): CheckRecord {
  return {
    ...record,
    input: record.input ? mapCheckInput(record.input) : null,
    result: record.result ? mapCheckResult(record.result) : null,
  };
}

function mapCheckInput(input: CheckInputDto): CheckInputDraft {
  return {
    mode: input.type,
    value: input.content,
  };
}

function mapCheckResult(result: CheckResultDto): CheckResultViewModel {
  return {
    ...result,
    verdictLabel: readVerdictCopy(result.verdictBand, "label", result.verdictLabel),
    headline: readVerdictCopy(result.verdictBand, "headline", result.headline),
    description: readVerdictCopy(result.verdictBand, "description", result.description),
    evidence: result.evidence.map(mapEvidenceItem),
  };
}

function mapEvidenceItem(item: EvidenceItemDto): EvidenceItem {
  const { clusterId, ...evidence } = item;
  return clusterId === undefined ? evidence : { ...evidence, clusterId };
}

function formatIssuePath(path: readonly PropertyKey[]): string {
  return path.length === 0 ? "<root>" : path.map((part) => String(part)).join(".");
}
