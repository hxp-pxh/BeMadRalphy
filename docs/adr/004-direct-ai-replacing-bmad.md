# ADR-004: Direct AI Planning Replaces BMAD CLI

## Status

Accepted

## Date

2026-02-10

## Context

The planning phase previously depended on `bmad install` shell execution. This introduced:

- external CLI installation requirements
- interactive prompt failure modes in unattended runs
- timeout and environment drift risks

## Decision

Replace BMAD CLI invocation with direct AI provider calls and embedded prompt templates:

- `product-brief.prompt.md`
- `prd.prompt.md`
- `architecture.prompt.md`
- `stories.prompt.md`

The planning phase now writes the same `_bmad-output/*` artifacts internally and keeps fallback artifact generation when provider calls fail.

## Consequences

- simpler operator setup
- fewer runtime dependency failures
- explicit model/config control via `.bemadralphyrc`
