# ADR-006: Internal Spec Engine Replaces OpenSpec CLI

## Status

Accepted

## Date

2026-02-10

## Context

Spec lifecycle operations (`init`, `validate`, `archive`) depended on the `openspec` CLI. This added one more external install and process shelling overhead.

## Decision

Implement spec lifecycle internally:

- scaffold `openspec/` directories and config
- validate requirements/scenario structure in spec markdown
- archive named changes into `openspec/changes/archive/*`

## Consequences

- removes external OpenSpec CLI dependency
- keeps spec-driven workflow structure
- makes validation/archive behavior testable in-process
- supersedes ADR-003
