import type { Logger } from "pino";

import { applyResultCopy, type EvidenceProvider, type ResultCopy } from "../evidenceProvider/types";
import type { ChecksRepository } from "../repositories/repositoryFacade";
import type { CheckResultDto } from "../types/results";

export async function withResultCopy(input: {
  checkId: string;
  mainClaim: string;
  result: CheckResultDto;
  evidenceProvider: EvidenceProvider;
  repository: ChecksRepository;
  logger: Logger;
  callProvider: <T>(
    operation: string,
    requestJson: unknown,
    execute: () => Promise<T>,
  ) => Promise<T>;
}): Promise<CheckResultDto> {
  try {
    const copy = await input.callProvider<ResultCopy>(
      "result_copy",
      {
        mainClaim: input.mainClaim,
        verdictBand: input.result.verdictBand,
        evidence: input.result.evidence,
        uncertaintyLines: input.result.uncertaintyLines,
      },
      () =>
        input.evidenceProvider.writeResultCopy({
          mainClaim: input.mainClaim,
          verdictBand: input.result.verdictBand,
          evidence: input.result.evidence,
          uncertaintyLines: input.result.uncertaintyLines,
        }),
    );
    return applyResultCopy(input.result, copy);
  } catch (error) {
    input.logger.warn(
      { error, checkId: input.checkId },
      "Result copy provider failed; using deterministic copy",
    );
    return input.result;
  }
}
