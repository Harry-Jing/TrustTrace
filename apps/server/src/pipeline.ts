import type { Logger } from "pino";

import { ProgressEventBus } from "./events";
import { ChecksRepository, makeProgressEvent } from "./repository";
import type { CheckInputDto, CheckRecordDto, CheckResultDto, ProgressEventDto } from "./types";

interface PipelineStep {
  seq: number;
  phase: ProgressEventDto["phase"];
  percent: number;
  message: string;
  stepCode: string;
  status?: ProgressEventDto["status"];
}

export interface SimulatedPipelineOptions {
  delayMs?: number;
  logger: Logger;
}

const PIPELINE_STEPS: readonly PipelineStep[] = [
  {
    seq: 2,
    phase: "strategy",
    percent: 22,
    message: "Choosing a source strategy.",
    stepCode: "strategy",
  },
  {
    seq: 3,
    phase: "discovery",
    percent: 38,
    message: "Preparing candidate source discovery.",
    stepCode: "discovery",
  },
  {
    seq: 4,
    phase: "verify_read",
    percent: 58,
    message: "Preparing URL verification and extraction.",
    stepCode: "verify_read",
  },
  {
    seq: 5,
    phase: "weigh",
    percent: 74,
    message: "Preparing deterministic evidence weighing.",
    stepCode: "weigh",
  },
  {
    seq: 6,
    phase: "verdict",
    percent: 88,
    message: "Preparing the user-facing explanation.",
    stepCode: "verdict",
  },
  {
    seq: 7,
    phase: "completed",
    percent: 100,
    message: "Check complete.",
    stepCode: "completed",
    status: "completed",
  },
];

export class SimulatedPipeline {
  private readonly delayMs: number;
  private readonly logger: Logger;
  private readonly activeRuns = new Set<Promise<void>>();

  constructor(
    private readonly repository: ChecksRepository,
    private readonly events: ProgressEventBus,
    options: SimulatedPipelineOptions,
  ) {
    this.delayMs = options.delayMs ?? 450;
    this.logger = options.logger;
  }

  start(checkId: string): void {
    const runPromise = this.run(checkId).catch((error: unknown) => {
      this.logger.error({ error, checkId }, "Simulated check pipeline failed");
    });
    this.activeRuns.add(runPromise);
    void runPromise.finally(() => {
      this.activeRuns.delete(runPromise);
    });
  }

  async waitForIdle(): Promise<void> {
    await Promise.all([...this.activeRuns]);
  }

  private async run(checkId: string): Promise<void> {
    for (const step of PIPELINE_STEPS) {
      await sleep(this.delayMs);

      const record = this.repository.getCheck(checkId);
      if (!record || record.status !== "running") return;

      const event = makeProgressEvent({
        checkId,
        seq: step.seq,
        phase: step.phase,
        percent: step.percent,
        message: step.message,
        stepCode: step.stepCode,
        ...(step.status ? { status: step.status } : {}),
      });

      if (event.status === "completed") {
        this.repository.completeCheckWithEvent(event, createStubResult(record, event.createdAt));
      } else {
        this.repository.recordProgressEvent(event);
      }

      this.events.publish(event);
    }
  }
}

function createStubResult(record: CheckRecordDto, completedAt: string): CheckResultDto {
  const input = record.input ?? ({ type: "text", content: "" } satisfies CheckInputDto);

  return {
    checkId: record.checkId,
    inputText: input.content,
    inputTypeLabel: input.type === "url" ? "URL input" : "text input",
    durationLabel: durationLabel(record.createdAt, completedAt),
    verdictBand: "needs_context",
    verdictLabel: "needs context",
    headline: "Backend pipeline stub completed.",
    description:
      "This backend slice confirms API, persistence, and progress streaming. It has not gathered or weighed external evidence yet.",
    atAGlance: {
      evidence: 0,
      independent: 0,
      fullText: 0,
      primary: 0,
      snippet: 0,
      uncertainty: "high",
    },
    cues: [
      {
        name: "Backend connection",
        text: "Server flow is connected.",
        note: "Evidence providers are intentionally stubbed in this slice.",
        strength: 1,
        tooltip: "This result is a placeholder until the verified evidence pipeline is connected.",
      },
    ],
    evidence: [],
    uncertaintyLines: [
      "No external sources were searched in this backend slice.",
      "The evidence list is intentionally empty until search, extraction, and source evaluation are implemented.",
    ],
    noteText:
      "Placeholder only: do not treat this as a credibility assessment of the submitted claim.",
    summaryText:
      "The backend accepted the check, persisted it, streamed progress, and returned a contract-compatible placeholder result.",
  };
}

function durationLabel(startedAt: string, completedAt: string): string {
  const durationMs = Date.parse(completedAt) - Date.parse(startedAt);
  if (!Number.isFinite(durationMs) || durationMs < 0) return "simulated";
  return `${(durationMs / 1000).toFixed(1)}s`;
}

function sleep(delayMs: number): Promise<void> {
  if (delayMs <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}
