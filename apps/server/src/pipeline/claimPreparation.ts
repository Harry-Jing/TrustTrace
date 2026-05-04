import type { ClaimAnalysisInput, EvidenceProvider } from "../evidenceProvider/types";
import type { ChecksRepository } from "../repositories/repositoryFacade";
import { fetchAndExtractSource } from "../sourceSafety/fetchSource";
import type { SourceFetchOptions } from "../sourceSafety/types";
import type { CheckInputDto } from "../types/checks";
import type { InputExtractionRecordDto } from "../types/sources";
import { normalizeSourceError, PipelineCheckError } from "./errors";
import type { PreparedClaim } from "./types";

export async function prepareClaim(input: {
  checkId: string;
  checkInput: CheckInputDto;
  repository: ChecksRepository;
  evidenceProvider: EvidenceProvider;
  sourceFetchOptions: SourceFetchOptions;
  callProvider: <T>(
    operation: string,
    requestJson: unknown,
    execute: () => Promise<T>,
  ) => Promise<T>;
}): Promise<PreparedClaim> {
  const claimInput = await buildClaimAnalysisInput(
    input.checkId,
    input.checkInput,
    input.repository,
    input.sourceFetchOptions,
  );
  const analysis = await input.callProvider("claim_analysis", claimInput, () =>
    input.evidenceProvider.analyzeClaim(claimInput),
  );
  const now = new Date().toISOString();
  const claimAnalysis = input.repository.saveClaimAnalysis({
    checkId: input.checkId,
    ...analysis,
    createdAt: now,
    updatedAt: now,
  });

  return { claimAnalysis };
}

async function buildClaimAnalysisInput(
  checkId: string,
  input: CheckInputDto,
  repository: ChecksRepository,
  sourceFetchOptions: SourceFetchOptions,
): Promise<ClaimAnalysisInput> {
  if (input.type !== "url") {
    return {
      input,
      extractedTitle: null,
      extractedTextExcerpt: null,
    };
  }

  const extraction = await extractInputUrl(checkId, input.content, repository, sourceFetchOptions);
  return {
    input,
    extractedTitle: extraction.title,
    extractedTextExcerpt: extraction.textExcerpt,
  };
}

async function extractInputUrl(
  checkId: string,
  inputUrl: string,
  repository: ChecksRepository,
  sourceFetchOptions: SourceFetchOptions,
): Promise<InputExtractionRecordDto> {
  const createdAt = new Date().toISOString();
  const record = repository.createInputExtraction({ checkId, inputUrl, createdAt });

  try {
    const fetched = await fetchAndExtractSource(inputUrl, sourceFetchOptions);
    const updated = repository.updateInputExtraction(record.id, {
      resolvedUrl: fetched.resolvedUrl,
      domain: fetched.domain,
      title: fetched.title,
      verificationStatus: "fetched",
      httpStatus: fetched.httpStatus,
      contentType: fetched.contentType,
      contentHash: fetched.contentHash,
      extractionMethod: fetched.extractionMethod,
      extractedText: fetched.extractedText,
      textExcerpt: fetched.textExcerpt,
      failureCode: null,
      failureMessage: null,
      updatedAt: new Date().toISOString(),
    });
    if (!updated) {
      throw new PipelineCheckError(
        "INPUT_EXTRACTION_FAILED",
        "input extraction",
        "The submitted URL could not be stored after extraction.",
      );
    }
    return updated;
  } catch (error) {
    const sourceError = normalizeSourceError(error);
    repository.updateInputExtraction(record.id, {
      verificationStatus: sourceError.blocked ? "blocked" : "extraction_failed",
      failureCode: sourceError.code,
      failureMessage: sourceError.message,
      updatedAt: new Date().toISOString(),
    });
    throw new PipelineCheckError(
      "INPUT_EXTRACTION_FAILED",
      "input extraction",
      `The submitted URL could not be safely fetched and extracted: ${sourceError.message}`,
      !sourceError.blocked,
    );
  }
}
