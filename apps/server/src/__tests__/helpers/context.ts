import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import pino from "pino";

import type { EvidenceProvider } from "../../evidenceProvider/types";
import { createServices, type TrustTraceServices } from "../../services";
import type { SourceFetchOptions } from "../../sourceSafety/types";
import { FakeEvidenceProvider } from "./fakeEvidenceProvider";
import { fakeSourceFetchOptions } from "./fakeSourceFetch";

interface TestContext {
  services: TrustTraceServices;
  cleanup: () => void;
}

interface TestContextOptions {
  pipelineDelayMs?: number;
  evidenceProvider?: EvidenceProvider | null;
  sourceFetchOptions?: SourceFetchOptions;
  openAiApiKey?: string | null;
}

const contexts: TestContext[] = [];

export function createTestContext(options: TestContextOptions = {}): TestContext {
  const dir = mkdtempSync(join(tmpdir(), "trusttrace-server-"));
  const services = createServices({
    dbPath: join(dir, "test.sqlite"),
    pipelineDelayMs: options.pipelineDelayMs ?? 1,
    logger: pino({ level: "silent" }),
    sourceFetchOptions: options.sourceFetchOptions ?? fakeSourceFetchOptions(),
    ...(options.evidenceProvider === null
      ? {}
      : { evidenceProvider: options.evidenceProvider ?? new FakeEvidenceProvider() }),
    ...(options.openAiApiKey === undefined ? {} : { openAiApiKey: options.openAiApiKey }),
  });
  const context = {
    services,
    cleanup: () => rmSync(dir, { recursive: true, force: true }),
  };
  contexts.push(context);
  return context;
}

export async function cleanupTestContexts(): Promise<void> {
  while (contexts.length > 0) {
    const context = contexts.pop();
    if (!context) return;
    await context.services.pipeline.waitForIdle();
    context.services.close();
    context.cleanup();
  }
}
