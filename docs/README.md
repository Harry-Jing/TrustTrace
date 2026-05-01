# TrustTrace Docs

This directory is the source of truth for product, architecture, development, operations, and reference documentation. Prefer small documents with one owner topic; link instead of duplicating long sections.

## Reading paths

### New contributor

1. [Product overview](product/overview.md)
2. [Local setup](development/setup.md)
3. [Commands](development/commands.md)
4. [Quality gate](development/quality.md)
5. [Conventions](development/conventions.md)

### Product or design reader

1. [Product overview](product/overview.md)
2. [Evidence model](product/evidence-model.md)
3. [Roadmap](product/roadmap.md)
4. [Glossary](reference/glossary.md)

### Engineer changing the system

1. [Architecture index](architecture/README.md)
2. [System overview](architecture/overview.md)
3. [Evidence pipeline](architecture/evidence-pipeline.md)
4. [API reference](reference/api.md)
5. [ADRs](adr/README.md)

### Operator or deployment reader

1. [Configuration](operations/configuration.md)
2. [CI](operations/ci.md)
3. [Server README](../apps/server/README.md)

## Sections

- `product/` — why TrustTrace exists, the evidence model, and roadmap.
- `architecture/` — current system design and package boundaries.
- `adr/` — short records for important decisions and rationale.
- `development/` — setup, commands, quality, conventions, and dev tooling.
- `operations/` — environment configuration and CI.
- `reference/` — API details and glossary.
- `archive/` — historical plans that are useful context but not current truth.
