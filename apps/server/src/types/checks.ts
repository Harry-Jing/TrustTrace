import type {
  CheckApiErrorDto as ContractCheckApiErrorDto,
  CheckErrorCodeDto as ContractCheckErrorCodeDto,
  CheckInputDto as ContractCheckInputDto,
  CheckListItemDto as ContractCheckListItemDto,
  DiscoveryStrategyDto as ContractDiscoveryStrategyDto,
  CheckPhaseDto,
  CheckProgressDto as ContractCheckProgressDto,
  CheckRecordDto as ContractCheckRecordDto,
  CheckStatusDto,
  CreateCheckResponseDto as ContractCreateCheckResponseDto,
  ProgressEventDto as ContractProgressEventDto,
  VerdictBandDto as ContractVerdictBandDto,
} from "@trusttrace/contracts/checks";

export type CheckStatus = CheckStatusDto;
export type CheckPhase = CheckPhaseDto;
export type InputType = ContractCheckInputDto["type"];
export type DiscoveryStrategy = ContractDiscoveryStrategyDto;
export type CheckInputDto = ContractCheckInputDto;
export type CheckApiErrorDto = ContractCheckApiErrorDto;
export type CheckErrorCode = ContractCheckErrorCodeDto;
export type CheckProgressDto = ContractCheckProgressDto;
export type ProgressEventDto = ContractProgressEventDto;
export type CheckRecordDto = ContractCheckRecordDto;
export type CreateCheckResponseDto = ContractCreateCheckResponseDto;
export type CheckListItemDto = ContractCheckListItemDto;
export type VerdictBandDto = ContractVerdictBandDto;
