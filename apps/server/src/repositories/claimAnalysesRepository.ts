import { eq } from "drizzle-orm";

import { claimAnalysesTable } from "../schema/audit";
import type { TrustTraceDatabase } from "../database/openDatabase";
import type { ClaimAnalysisDto } from "../types/claim";
import { claimAnalysisToRow, rowToClaimAnalysis } from "./mappers/claimAnalysisMapper";

export class ClaimAnalysesRepository {
  constructor(private readonly db: TrustTraceDatabase) {}

  saveClaimAnalysis(input: ClaimAnalysisDto): ClaimAnalysisDto {
    this.db
      .insert(claimAnalysesTable)
      .values(claimAnalysisToRow(input))
      .onConflictDoUpdate({
        target: claimAnalysesTable.checkId,
        set: {
          mainClaim: input.mainClaim,
          claimType: input.claimType,
          domain: input.domain,
          temporalScope: input.temporalScope,
          geographicScope: input.geographicScope,
          ambiguityNotesJson: input.ambiguityNotes,
          queryPlanJson: input.queryPlan,
          updatedAt: input.updatedAt,
        },
      })
      .run();
    return input;
  }

  getClaimAnalysis(checkId: string): ClaimAnalysisDto | null {
    const row = this.db
      .select()
      .from(claimAnalysesTable)
      .where(eq(claimAnalysesTable.checkId, checkId))
      .get();
    return row ? rowToClaimAnalysis(row) : null;
  }
}
