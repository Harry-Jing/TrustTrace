import { expect } from "bun:test";

import type { TrustTraceServices } from "../../services";
import type {
  CheckRecordDto,
  CreateCheckResponseDto,
  DiscoveryStrategy,
  ProgressEventDto,
} from "../../types/checks";

export async function createCheck(
  services: TrustTraceServices,
  content: string,
  discoveryStrategy: DiscoveryStrategy = "search_api",
): Promise<CreateCheckResponseDto> {
  const response = await services.app.request("/v1/checks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input: { type: "text", content }, discoveryStrategy }),
  });

  expect(response.status).toBe(201);
  return (await response.json()) as CreateCheckResponseDto;
}

export async function createUrlCheck(
  services: TrustTraceServices,
  content: string,
  discoveryStrategy: DiscoveryStrategy = "search_api",
): Promise<CreateCheckResponseDto> {
  const response = await services.app.request("/v1/checks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input: { type: "url", content }, discoveryStrategy }),
  });

  expect(response.status).toBe(201);
  return (await response.json()) as CreateCheckResponseDto;
}

export async function getRecord(
  services: TrustTraceServices,
  checkId: string,
): Promise<CheckRecordDto> {
  const response = await services.app.request(`/v1/checks/${checkId}`);
  expect(response.status).toBe(200);
  return (await response.json()) as CheckRecordDto;
}

export async function responseText(response: Response): Promise<string> {
  return Promise.race([
    response.text(),
    new Promise<string>((_, reject) => {
      setTimeout(() => {
        reject(new Error("Timed out while reading response text."));
      }, 1000);
    }),
  ]);
}

export function parseProgressEvents(text: string): ProgressEventDto[] {
  return text
    .split("\n\n")
    .filter((block) => block.split("\n").some((line) => line.startsWith("data: ")))
    .map((block) => {
      const dataLine = block.split("\n").find((line) => line.startsWith("data: "));
      if (!dataLine) throw new Error(`Missing SSE data line in block: ${block}`);
      return JSON.parse(dataLine.slice("data: ".length)) as ProgressEventDto;
    });
}
