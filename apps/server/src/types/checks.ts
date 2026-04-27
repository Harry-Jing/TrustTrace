import type {
  CheckApiErrorDto as ContractCheckApiErrorDto,
  CheckInputDto as ContractCheckInputDto,
  CheckListItemDto as ContractCheckListItemDto,
  CheckPhaseDto,
  CheckProgressDto as ContractCheckProgressDto,
  CheckRecordDto as ContractCheckRecordDto,
  CheckStatusDto,
  CreateCheckResponseDto as ContractCreateCheckResponseDto,
  ProgressEventDto as ContractProgressEventDto,
} from "@trusttrace/contracts/checks";

export type CheckStatus = CheckStatusDto;
export type CheckPhase = CheckPhaseDto;
export type InputType = ContractCheckInputDto["type"];
export type CheckInputDto = ContractCheckInputDto;
export type CheckApiErrorDto = ContractCheckApiErrorDto;
export type CheckProgressDto = ContractCheckProgressDto;
export type ProgressEventDto = ContractProgressEventDto;
export type CheckRecordDto = ContractCheckRecordDto;
export type CreateCheckResponseDto = ContractCreateCheckResponseDto;
export type CheckListItemDto = ContractCheckListItemDto;
