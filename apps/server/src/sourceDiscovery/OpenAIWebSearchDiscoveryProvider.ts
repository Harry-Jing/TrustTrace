import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";

import type { OpenAIReasoningEffort } from "../config";
import { EvidenceProviderError } from "../evidenceProvider/types";
import { discoveryResponseSchema } from "../evidenceProvider/openaiSchemas";
import { providerError } from "../evidenceProvider/openaiErrors";
import { dedupeSources, extractSourcesFromResponse } from "./responseSources";
import type {
  DiscoveredSource,
  DiscoveryInput,
  DiscoveryProviderMetadata,
  SourceDiscoveryProvider,
} from "./types";

interface OpenAIWebSearchDiscoveryProviderOptions {
  apiKey: string | null;
  model: string;
  reasoningEffort: OpenAIReasoningEffort;
}

export class OpenAIWebSearchDiscoveryProvider implements SourceDiscoveryProvider {
  readonly metadata: DiscoveryProviderMetadata;

  private readonly client: OpenAI | null;
  private readonly reasoningEffort: OpenAIReasoningEffort;

  constructor(options: OpenAIWebSearchDiscoveryProviderOptions) {
    this.client = options.apiKey ? new OpenAI({ apiKey: options.apiKey }) : null;
    this.reasoningEffort = options.reasoningEffort;
    this.metadata = {
      provider: "openai:web_search",
      model: options.model,
    };
  }

  async discoverSources(input: DiscoveryInput, maxCandidates: number): Promise<DiscoveredSource[]> {
    const client = this.requireClient();

    try {
      const response = await client.responses.parse({
        model: this.metadata.model,
        reasoning: { effort: this.reasoningEffort },
        tools: [{ type: "web_search", search_context_size: "medium" }],
        tool_choice: "required",
        include: ["web_search_call.action.sources"],
        max_output_tokens: 1_600,
        text: {
          format: zodTextFormat(discoveryResponseSchema, "trusttrace_source_discovery"),
        },
        instructions:
          "You discover candidate source URLs for evidence checking. Use web search. Return only URLs that may help verify, challenge, or contextualize the submitted main claim. Prefer original, official, primary, academic, or source-rich pages. Do not decide whether the claim is true.",
        input: JSON.stringify(
          {
            originalInputType: input.originalInput.type,
            mainClaim: input.claimAnalysis.mainClaim,
            claimType: input.claimAnalysis.claimType,
            domain: input.claimAnalysis.domain,
            temporalScope: input.claimAnalysis.temporalScope,
            geographicScope: input.claimAnalysis.geographicScope,
            queryPlan: input.claimAnalysis.queryPlan,
            maxCandidates,
          },
          null,
          2,
        ),
      });

      return dedupeSources([
        ...(response.output_parsed?.candidates ?? []),
        ...extractSourcesFromResponse(response),
      ]).slice(0, maxCandidates);
    } catch (error) {
      throw providerError(error, "SOURCE_DISCOVERY_FAILED", "OpenAI source discovery failed.");
    }
  }

  private requireClient(): OpenAI {
    if (!this.client) {
      throw new EvidenceProviderError(
        "PROVIDER_CONFIGURATION_ERROR",
        "OPENAI_API_KEY is required to run LLM web search discovery checks.",
      );
    }
    return this.client;
  }
}
