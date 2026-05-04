# 0003. Use Evidence-First Claim-Checking Pipeline

Status: Accepted
Date: 2026-05-01
Related: [Evidence model](../product/evidence-model.md), [Evidence pipeline](../architecture/evidence-pipeline.md)

## Context

A credibility service can easily overstate certainty by asking an LLM whether a claim is true or false. TrustTrace needs a safer product model: collect evidence, show uncertainty, and make source context inspectable.

## Options

- Let an LLM answer directly from model memory.
- Use search snippets as the main evidence source.
- Build an evidence-first backend pipeline with verified sources and deterministic synthesis.

## Decision

TrustTrace uses an evidence-first pipeline. Discovery tools may find candidate URLs, but evidence must pass backend URL safety, extraction, ranking, assessment, persistence, and deterministic synthesis before it influences the final band. LLM output is bounded to claim analysis, assessment over supplied passages, and user-facing copy from the verified evidence matrix.

## Consequences

- The product avoids binary true/false framing.
- Snippet-only rows are weak context and cannot independently produce strong evidence.
- Provider strategy selection cannot bypass the evidence gate.
- The system must surface uncertainty and distinguish thin evidence from system failure.

## Confirmation

The accepted P1.5 implementation requires `discoveryStrategy` and routes all discovered URLs through the same backend evidence gate.
