# ADR-005: Embedded SQLite Task Manager Replaces Beads CLI

## Status

Accepted

## Date

2026-02-10

## Context

Task orchestration previously delegated to `bd` commands (`ready`, `create`, `close`, `update`). This required a separate installation and duplicated responsibilities already controlled by BeMadRalphy.

## Decision

Adopt an embedded SQLite task manager (`.bemadralphy/tasks.db`) and port key Beads patterns:

- task schema with statuses and metadata
- dependency edges
- recursive CTE-based ready queue resolution

`sync` and `execute` phases now operate directly on internal task state.

## Consequences

- removes external Beads CLI dependency
- improves determinism for task operations
- keeps dependency-aware scheduling semantics
- supersedes ADR-002
