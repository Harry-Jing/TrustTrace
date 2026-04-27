import type { SourceForAssessment } from "../evidenceProvider/types";
import type { ChecksRepository } from "../repositories/repositoryFacade";
import { fetchAndExtractSource } from "../sourceSafety/fetchSource";
import type { SourceFetchOptions } from "../sourceSafety/types";
import { assertSafeUrl, canonicalHttpUrl } from "../sourceSafety/urlSafety";
import { isSnippetOnlySource } from "../sources/ranking";
import type { SourceExtractionRecordDto } from "../types/sources";
import { normalizeSourceError } from "./errors";

export async function verifyAndExtractSources(input: {
  repository: ChecksRepository;
  sourceRecords: readonly SourceExtractionRecordDto[];
  sourceFetchOptions: SourceFetchOptions;
  maxCandidateSources: number;
}): Promise<SourceExtractionRecordDto[]> {
  const verifiedSources: SourceExtractionRecordDto[] = [];

  for (const source of input.sourceRecords.slice(0, input.maxCandidateSources)) {
    try {
      const fetched = await fetchAndExtractSource(source.candidateUrl, input.sourceFetchOptions);
      const updated = input.repository.updateSourceExtraction(source.id, {
        resolvedUrl: fetched.resolvedUrl,
        domain: fetched.domain,
        title: source.title ?? fetched.title,
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
      if (updated) verifiedSources.push(updated);
    } catch (error) {
      const sourceError = normalizeSourceError(error);
      const snippetSource = sourceError.blocked
        ? null
        : await tryCreateSnippetOnlySource(
            input.repository,
            input.sourceFetchOptions,
            source,
            sourceError,
          );
      if (snippetSource) {
        verifiedSources.push(snippetSource);
        continue;
      }

      input.repository.updateSourceExtraction(source.id, {
        verificationStatus: sourceError.blocked ? "blocked" : "extraction_failed",
        failureCode: sourceError.code,
        failureMessage: sourceError.message,
        updatedAt: new Date().toISOString(),
      });
    }
  }

  return verifiedSources;
}

export function sourceToAssessmentInput(source: SourceExtractionRecordDto): SourceForAssessment {
  return {
    resolvedUrl: source.resolvedUrl ?? source.candidateUrl,
    domain: source.domain ?? new URL(source.resolvedUrl ?? source.candidateUrl).hostname,
    title: source.title,
    textExcerpt: source.textExcerpt ?? "",
    extractionMethod: source.extractionMethod,
    isSnippetOnly: isSnippetOnlySource(source),
  };
}

async function tryCreateSnippetOnlySource(
  repository: ChecksRepository,
  sourceFetchOptions: SourceFetchOptions,
  source: SourceExtractionRecordDto,
  sourceError: { code: string; message: string },
): Promise<SourceExtractionRecordDto | null> {
  const snippet = normalizeSnippet(source.discoverySnippet);
  if (!snippet) return null;

  try {
    await assertSafeUrl(source.candidateUrl, sourceFetchOptions.resolveHostname);
    const resolvedUrl = canonicalHttpUrl(source.candidateUrl);
    return repository.updateSourceExtraction(source.id, {
      resolvedUrl,
      domain: new URL(resolvedUrl).hostname,
      title: source.title,
      verificationStatus: "snippet_only",
      httpStatus: null,
      contentType: null,
      contentHash: null,
      extractionMethod: "snippet_only",
      extractedText: null,
      textExcerpt: snippet,
      failureCode: sourceError.code,
      failureMessage: sourceError.message,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    const snippetError = normalizeSourceError(error);
    repository.updateSourceExtraction(source.id, {
      verificationStatus: snippetError.blocked ? "blocked" : "extraction_failed",
      failureCode: snippetError.code,
      failureMessage: snippetError.message,
      updatedAt: new Date().toISOString(),
    });
    return null;
  }
}

function normalizeSnippet(value: string | null): string | null {
  const snippet = value?.replace(/\s+/g, " ").trim();
  if (!snippet || snippet.length < 20) return null;
  return snippet.length <= 1_200 ? snippet : `${snippet.slice(0, 1_199)}…`;
}
