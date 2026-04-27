import type { TrustTraceDatabase } from "../database/openDatabase";
import type {
  NewProviderCallDto,
  ProviderCallRecordDto,
  ProviderCallUpdateDto,
  SourceEvaluationRecordDto,
} from "../types/audit";
import type {
  CheckApiErrorDto,
  CheckInputDto,
  CheckListItemDto,
  CheckRecordDto,
  ProgressEventDto,
} from "../types/checks";
import type { ClaimAnalysisDto } from "../types/claim";
import type { CheckResultDto } from "../types/results";
import type {
  InputExtractionRecordDto,
  NewSourceExtractionDto,
  SourceExtractionRecordDto,
  SourceExtractionUpdateDto,
} from "../types/sources";
import { CheckRecordsRepository } from "./checkRecordsRepository";
import { ClaimAnalysesRepository } from "./claimAnalysesRepository";
import { InputExtractionsRepository } from "./inputExtractionsRepository";
import { ProviderCallsRepository } from "./providerCallsRepository";
import { SourceEvaluationsRepository } from "./sourceEvaluationsRepository";
import { SourceExtractionsRepository } from "./sourceExtractionsRepository";

export class ChecksRepository {
  private readonly checks: CheckRecordsRepository;
  private readonly claimAnalyses: ClaimAnalysesRepository;
  private readonly inputExtractions: InputExtractionsRepository;
  private readonly providerCalls: ProviderCallsRepository;
  private readonly sourceEvaluations: SourceEvaluationsRepository;
  private readonly sourceExtractions: SourceExtractionsRepository;

  constructor(db: TrustTraceDatabase) {
    this.checks = new CheckRecordsRepository(db);
    this.claimAnalyses = new ClaimAnalysesRepository(db);
    this.inputExtractions = new InputExtractionsRepository(db);
    this.providerCalls = new ProviderCallsRepository(db);
    this.sourceEvaluations = new SourceEvaluationsRepository(db);
    this.sourceExtractions = new SourceExtractionsRepository(db);
  }

  createCheck(input: CheckInputDto): CheckRecordDto {
    return this.checks.createCheck(input);
  }

  getCheck(checkId: string): CheckRecordDto | null {
    return this.checks.getCheck(checkId);
  }

  listChecks(limit: number, offset: number): CheckListItemDto[] {
    return this.checks.listChecks(limit, offset);
  }

  listEventsAfter(checkId: string, afterSeq: number): ProgressEventDto[] {
    return this.checks.listEventsAfter(checkId, afterSeq);
  }

  recordProgressEvent(event: ProgressEventDto): void {
    this.checks.recordProgressEvent(event);
  }

  completeCheckWithEvent(event: ProgressEventDto, result: CheckResultDto): void {
    this.checks.completeCheckWithEvent(event, result);
  }

  failCheckWithEvent(event: ProgressEventDto, error: CheckApiErrorDto): void {
    this.checks.failCheckWithEvent(event, error);
  }

  createSourceExtraction(input: NewSourceExtractionDto): SourceExtractionRecordDto {
    return this.sourceExtractions.createSourceExtraction(input);
  }

  updateSourceExtraction(
    id: string,
    update: SourceExtractionUpdateDto,
  ): SourceExtractionRecordDto | null {
    return this.sourceExtractions.updateSourceExtraction(id, update);
  }

  listSourceExtractions(checkId: string): SourceExtractionRecordDto[] {
    return this.sourceExtractions.listSourceExtractions(checkId);
  }

  saveClaimAnalysis(input: ClaimAnalysisDto): ClaimAnalysisDto {
    return this.claimAnalyses.saveClaimAnalysis(input);
  }

  getClaimAnalysis(checkId: string): ClaimAnalysisDto | null {
    return this.claimAnalyses.getClaimAnalysis(checkId);
  }

  createProviderCall(input: NewProviderCallDto): ProviderCallRecordDto {
    return this.providerCalls.createProviderCall(input);
  }

  updateProviderCall(id: string, update: ProviderCallUpdateDto): ProviderCallRecordDto | null {
    return this.providerCalls.updateProviderCall(id, update);
  }

  listProviderCalls(checkId: string): ProviderCallRecordDto[] {
    return this.providerCalls.listProviderCalls(checkId);
  }

  createInputExtraction(input: {
    checkId: string;
    inputUrl: string;
    createdAt: string;
  }): InputExtractionRecordDto {
    return this.inputExtractions.createInputExtraction(input);
  }

  updateInputExtraction(
    id: string,
    update: SourceExtractionUpdateDto,
  ): InputExtractionRecordDto | null {
    return this.inputExtractions.updateInputExtraction(id, update);
  }

  listInputExtractions(checkId: string): InputExtractionRecordDto[] {
    return this.inputExtractions.listInputExtractions(checkId);
  }

  createSourceEvaluation(input: Omit<SourceEvaluationRecordDto, "id">): SourceEvaluationRecordDto {
    return this.sourceEvaluations.createSourceEvaluation(input);
  }

  listSourceEvaluations(checkId: string): SourceEvaluationRecordDto[] {
    return this.sourceEvaluations.listSourceEvaluations(checkId);
  }
}
