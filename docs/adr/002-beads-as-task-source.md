# ADR-002: Beads as the Single Task Source of Truth

## Status

Accepted

## Date

2026-02-09

## Context

BeMadRalphy orchestrates task execution across multiple AI engines. We needed a system to:

1. Store tasks with dependencies
2. Track task status (pending, in-progress, completed, blocked)
3. Provide dependency-aware ordering (`bd ready` returns unblocked tasks)
4. Persist across sessions (resumability)
5. Support parallel execution without conflicts

Options considered:

1. **Beads** — Git-backed graph issue tracker with hierarchical IDs and dependency tracking
2. **Custom task store** — Build our own JSONL/SQLite-based task system
3. **GitHub Issues** — Use GitHub's issue tracker via API
4. **Linear/Jira** — External project management tools
5. **In-memory only** — No persistence, tasks live only during execution

## Decision

Use **Beads** as the single source of truth for task management.

All tasks flow through Beads:
- BMAD stories are converted to Beads issues via `bd create`
- Dependencies are tracked via `bd dep add`
- `bd ready` returns the next executable tasks (respecting dependencies)
- `bd close` marks tasks complete (gated on test success)
- `bd update` tracks progress

A human-readable `tasks.md` is generated from Beads for visibility, but it's read-only — Beads is authoritative.

## Consequences

### Positive

- **Dependency-aware execution**: `bd ready` handles topological sorting
- **Persistent memory**: `.beads/issues.jsonl` survives restarts
- **Git-backed**: Task history is versioned with the codebase
- **Hierarchical IDs**: Natural epic/task structure (e.g., `bd-a1b2` under `bd-a1`)
- **AI agent memory**: Beads was designed for AI agents to read/write
- **Existing tool**: No need to build task management from scratch
- **Cross-session**: Resume exactly where you left off

### Negative

- **External dependency**: Requires Beads CLI (`bd`) to be installed
- **JSONL format**: Not human-editable (hence `tasks.md` for visibility)
- **Single-writer constraint**: Parallel execution requires serialized writes
- **Learning curve**: Users must understand Beads commands

### Mitigations

- **Auto-install**: `bemadralphy init` installs Beads if missing
- **`tasks.md`**: Human-readable view regenerated after each change
- **Writer queue**: `src/beads/writer.ts` serializes all write operations
- **Abstraction**: Users interact with BeMadRalphy, not Beads directly

## Implementation Details

### Story-to-Beads Conversion

```
BMAD story (markdown) → Parse → bd create → Beads issue
                              → bd dep add (for dependencies)
```

### Execution Loop

```
bd ready → Get unblocked tasks
        → Dispatch to engine
        → Run tests
        → bd close (on success) or bd update (on failure)
        → Repeat
```

### Concurrency Safeguards

All `bd close` and `bd update` operations go through a single-writer queue to prevent JSONL conflicts:

```typescript
class BeadsWriter {
  private queue: AsyncQueue;

  async close(id: string) {
    return this.queue.add(() => exec(`bd close ${id}`));
  }
}
```

## Alternatives Considered

### Custom Task Store

Rejected because:
- Reinventing the wheel
- Beads already solves dependency tracking
- Would need to build persistence, ordering, etc.

### GitHub Issues

Rejected because:
- Requires network access
- Rate limits
- Overkill for local development
- Not designed for AI agent interaction

### Linear/Jira

Rejected because:
- External service dependency
- Authentication complexity
- Not designed for automated task management

### In-Memory Only

Rejected because:
- No resumability
- Lost progress on crash/restart
- Can't pause and continue later

## Related

- [Beads documentation](https://github.com/steveyegge/beads)
- [docs/architecture.md](../architecture.md) — Beads integration details
- [ADR-001](001-cli-only.md) — CLI-only decision (Beads fits this model)
