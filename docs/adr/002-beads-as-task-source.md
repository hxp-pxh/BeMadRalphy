# ADR-002: Beads as the Single Task Source of Truth

## Status

**Superseded** by [ADR-005](005-embedded-sqlite-replacing-beads.md)

## Date

2026-02-09

## Context

BeMadRalphy orchestrates task execution across multiple AI engines. We needed a system to:

1. Store tasks with dependencies
2. Track task status (pending, in-progress, completed, blocked)
3. Provide dependency-aware ordering (return unblocked tasks)
4. Persist across sessions (resumability)
5. Support parallel execution without conflicts

Options considered:

1. **Beads** -- Git-backed graph issue tracker with hierarchical IDs and dependency tracking
2. **Custom task store** -- SQLite-based task system
3. **GitHub Issues** -- GitHub issue tracker via API
4. **Linear/Jira** -- External project management tools
5. **In-memory only** -- No persistence

## Decision (v1)

Use **Beads** as the single source of truth for task management.

All tasks flowed through the Beads CLI:

- `bd create` for task creation
- `bd dep add` for dependency tracking
- `bd ready` for dependency-aware task ordering
- `bd close` for task completion
- `bd update` for progress tracking

A human-readable `tasks.md` was generated from Beads for visibility.

## Superseded (v2)

In v2, this decision was superseded by [ADR-005](005-embedded-sqlite-replacing-beads.md). The external Beads CLI dependency was replaced by an embedded SQLite task manager (`.bemadralphy/tasks.db`) that ports the core Beads patterns:

- Task schema with statuses and metadata
- Dependency edges table
- Recursive CTE-based ready queue resolution (ported from Beads)
- WAL mode for concurrent read safety

This eliminated the external CLI dependency while preserving the dependency-aware scheduling semantics that made Beads valuable.

## Related

- [ADR-005](005-embedded-sqlite-replacing-beads.md) -- Embedded SQLite replaces Beads CLI
- [Beads documentation](https://github.com/steveyegge/beads) -- Original inspiration
- [docs/architecture.md](../architecture.md) -- Task Manager details
