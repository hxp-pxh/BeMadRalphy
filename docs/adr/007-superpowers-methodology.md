# ADR-007: Adopt Superpowers Execution Methodology

## Status

Accepted

## Date

2026-02-10

## Context

Execution quality varies heavily by prompt discipline and review loops. We need consistent implementation behavior across engines, not just task dispatch.

## Decision

Adopt and embed Superpowers methodology patterns in execution and steering:

- TDD-first implementation guardrail
- verification-before-completion language and checks
- two-stage review concept (spec compliance then quality)
- anti-rationalization rules in generated steering files

This is an internal adaptation, not a plugin dependency.

## Consequences

- better consistency in generated agent instructions
- improved quality gate semantics for execution tasks
- preserves compatibility with autonomous and supervised modes
