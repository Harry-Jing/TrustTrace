import type {
  CheckResultDto as ContractCheckResultDto,
  CredibilityCueDto as ContractCredibilityCueDto,
  EvidenceItemDto as ContractEvidenceItemDto,
  ResultAtAGlanceDto as ContractResultAtAGlanceDto,
} from "@trusttrace/contracts/checks";

export type VerdictBand = ContractCheckResultDto["verdictBand"];
export type ResultAtAGlanceDto = ContractResultAtAGlanceDto;
export type CredibilityCueDto = ContractCredibilityCueDto;
export type EvidenceItemDto = ContractEvidenceItemDto;
export type CheckResultDto = ContractCheckResultDto;
