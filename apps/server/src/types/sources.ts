export type SourceExtractionStatus =
  | "candidate"
  | "blocked"
  | "fetched"
  | "snippet_only"
  | "extraction_failed";

export interface InputExtractionRecordDto {
  id: string;
  checkId: string;
  inputUrl: string;
  resolvedUrl: string | null;
  domain: string | null;
  title: string | null;
  verificationStatus: SourceExtractionStatus;
  httpStatus: number | null;
  contentType: string | null;
  contentHash: string | null;
  extractionMethod: string | null;
  extractedText: string | null;
  textExcerpt: string | null;
  failureCode: string | null;
  failureMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SourceExtractionRecordDto {
  id: string;
  checkId: string;
  candidateUrl: string;
  resolvedUrl: string | null;
  domain: string | null;
  title: string | null;
  discoverySnippet: string | null;
  discoveryProvider: string;
  discoveryRank: number;
  verificationStatus: SourceExtractionStatus;
  httpStatus: number | null;
  contentType: string | null;
  contentHash: string | null;
  extractionMethod: string | null;
  extractedText: string | null;
  textExcerpt: string | null;
  failureCode: string | null;
  failureMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NewSourceExtractionDto {
  checkId: string;
  candidateUrl: string;
  title: string | null;
  discoverySnippet: string | null;
  discoveryProvider: string;
  discoveryRank: number;
  createdAt: string;
}

export interface SourceExtractionUpdateDto {
  resolvedUrl?: string | null;
  domain?: string | null;
  title?: string | null;
  verificationStatus?: SourceExtractionStatus;
  httpStatus?: number | null;
  contentType?: string | null;
  contentHash?: string | null;
  extractionMethod?: string | null;
  extractedText?: string | null;
  textExcerpt?: string | null;
  failureCode?: string | null;
  failureMessage?: string | null;
  updatedAt: string;
}
