# BeMadRalphy Architecture

This document describes the architecture of BeMadRalphy, including module structure, data flow, and key design decisions.

Current implementation covers:

- Intake parsing (`idea.md`/`plan.md`) and `.bemadralphy/intake.yaml`
- BMAD bootstrap plus generated planning outputs under `_bmad-output/`
- Steering file generation (AGENTS.md, CLAUDE.md, Cursor/Windsurf/Cline/Kiro rules)
- `tasks.md` generation and Beads issue lifecycle integration
- State and cost persistence in `.bemadralphy/`
- Execution through CLI-backed engine adapters with Ralphy support

## Overview

BeMadRalphy is a CLI orchestrator that coordinates four underlying systems:

1. **BMAD-METHOD** — Planning workflows (product briefs, PRDs, architecture, stories)
2. **Beads** — Git-backed task graph and persistent memory
3. **Ralphy-style execution** — Multi-engine autonomous coding loop (logic ported, not a runtime dependency)
4. **OpenSpec** — Living specifications and delta-based change tracking

```text
┌─────────────────────────────────────────────────────────────────────┐
│                         BeMadRalphy CLI                              │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐   │
│  │ Explore │→ │ Intake  │→ │Planning │→ │Steering │→ │Scaffold │   │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────────┘   │
│       ↓            ↓            ↓            ↓            ↓         │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐               │
│  │  Sync   │→ │ Execute │→ │ Verify  │→ │  Post   │               │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘               │
├─────────────────────────────────────────────────────────────────────┤
│                        Supporting Modules                            │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐   │
│  │ Engines │  │  Swarm  │  │  Beads  │  │  Specs  │  │  State  │   │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```text
src/
├── cli.ts                  # CLI entry point (commander/yargs)
├── index.ts                # Programmatic API entry
│
├── phases/                 # Pipeline phases (executed in order)
│   ├── explore.ts          # Phase 0: Codebase/domain exploration
│   ├── intake.ts           # Phase 1: Read idea.md, Q&A, generate intake.yaml
│   ├── planning.ts         # Phase 2: BMAD workflow invocation
│   ├── steering.ts         # Phase 3: Generate all steering files
│   ├── scaffold.ts         # Phase 4: git init, package.json, configs
│   ├── sync.ts             # Phase 5: Stories → Beads, tasks.md
│   ├── execute.ts          # Phase 6: Swarm-aware execution loop
│   ├── verify.ts           # Phase 7: Semantic verification
│   └── post.ts             # Phase 8: Code review, docs, deploy
│
├── planning/               # Planning utilities
│   └── validate.ts         # BMAD output validation + retry logic
│
├── engines/                # AI engine adapters
│   ├── types.ts            # Common engine interface
│   ├── claude.ts           # Claude Code adapter
│   ├── cursor.ts           # Cursor adapter
│   ├── codex.ts            # OpenAI Codex adapter
│   ├── kimi.ts             # Kimi K2.5 adapter (API-based)
│   ├── opencode.ts         # OpenCode adapter
│   ├── qwen.ts             # Qwen adapter
│   ├── copilot.ts          # GitHub Copilot adapter
│   └── gemini.ts           # Gemini adapter
│
├── swarm/                  # Native swarm integrations
│   ├── detector.ts         # Detect swarm capabilities
│   ├── claude-teams.ts     # Claude Agent Teams (TeammateTool)
│   ├── kimi-parl.ts        # Kimi K2.5 PARL swarm
│   └── codex-sdk.ts        # Codex Agents SDK
│
├── beads/                  # Beads integration
│   ├── adapter.ts          # Stories → Beads conversion
│   ├── writer.ts           # Serialized write queue
│   └── tasks-md.ts         # tasks.md generation
│
├── specs/                  # Living spec management
│   ├── generate.ts         # Generate specs from code
│   ├── delta.ts            # Delta spec operations
│   └── archive.ts          # Archive completed changes
│
├── docs/                   # Documentation generators
│   ├── readme.ts           # README.md generation
│   ├── onboarding.ts       # docs/onboarding.md
│   ├── adr.ts              # Architecture Decision Records
│   ├── runbook.ts          # docs/runbook.md
│   ├── release-notes.ts    # RELEASE_NOTES.md
│   ├── component-docs.ts   # Per-module docs (monorepo)
│   ├── api-docs.ts         # API documentation
│   └── pr-body.ts          # Auto-generated PR descriptions
│
├── scaffold/               # Config generators
│   ├── test-config.ts      # vitest/jest/playwright configs
│   ├── lint-config.ts      # eslint/prettier configs
│   ├── ci-pipeline.ts      # GitHub Actions workflows
│   ├── security-config.ts  # .gitleaks, .npmrc
│   └── tsconfig.ts         # TypeScript configuration
│
├── state.ts                # Pipeline state management
├── cost.ts                 # Cost tracking and budget
├── errors.ts               # Error recovery and logging
├── locks.ts                # File reservation/locking
├── permissions.ts          # Engine permission profiles
└── release.ts              # Semantic versioning, git tags
```

---

## Data Flow

### Phase 0: Explore (Optional)

```text
User query → AI analysis → Exploration report
                ↓
         User refines idea.md
```

### Phase 1: Idea Intake

```text
idea.md → Detect mode → Classify type → Extract decisions → Q&A → intake.yaml
              ↓
    Greenfield or Brownfield?
```

### Phase 2: Planning

**Greenfield:**

```text
intake.yaml → BMAD Analyst → Product Brief
                   ↓
            BMAD PM → PRD
                   ↓
         BMAD Architect → Architecture
                   ↓
            BMAD PM → Epics & Stories
```

**Brownfield:**

```text
intake.yaml → Codebase analysis → Proposal → Spec deltas → Design → Tasks
```

### Phase 3-8: Build & Deploy

```text
Stories/Tasks → Steering files → Scaffold → Beads sync → Execute → Verify → Post
                                                ↓
                                    Native swarm or process parallel
```

---

## Key Components

### Engine Adapters

Each engine adapter implements a common interface:

```typescript
interface EngineAdapter {
  name: string;
  hasNativeSwarm: boolean;
  permissionFlags: string[];

  execute(task: Task, options: ExecuteOptions): Promise<TaskResult>;
  checkAvailable(): Promise<boolean>;
}
```

Adapters handle the specifics of invoking each AI engine CLI or API, including:

- Prompt assembly
- Permission flags (e.g., `--dangerously-skip-permissions` for Claude)
- Output parsing
- Error handling

### Swarm Detection

The swarm detector checks:

1. Which engine is selected
2. Whether the engine supports native swarm
3. Whether the required CLI/API version is available
4. User override flags (`--swarm native|process|off`)

### Beads Writer Queue

All Beads write operations (`bd close`, `bd update`) go through a single-writer queue to prevent JSONL conflicts during parallel execution:

```typescript
class BeadsWriter {
  private queue: AsyncQueue;

  async close(issueId: string): Promise<void> {
    return this.queue.add(() => this.execClose(issueId));
  }
}
```

### State Management

Pipeline state is persisted in `.bemadralphy/state.yaml`:

```yaml
phase: execution
mode: hybrid
engine: claude
last_gate: architecture
tasks_completed: 12
tasks_total: 24
cost_usd: 3.47
started_at: 2026-02-09T10:00:00Z
```

This enables:

- Resuming after interruption
- Tracking progress across sessions
- Cost monitoring

---

## BMAD Invocation Strategy

BMAD is designed for interactive IDE use. BeMadRalphy invokes it programmatically:

1. **Prompt injection**: Read BMAD agent/workflow markdown from `_bmad/` and inject as system context
2. **Planning model override**: Use `--planning-engine` for higher-quality planning model
3. **Engine dispatch**: Invoke engine CLI with assembled prompt
4. **Validation**: Check output for required sections; retry with corrections if needed
5. **Output storage**: Write to `_bmad-output/`

This allows BeMadRalphy to work headlessly without an IDE.

---

## Concurrency Model

### Native Swarm Mode

For engines with native swarm (Claude, Kimi, Codex):

```text
bd ready (all unblocked) → Group by epic → Feed batch to swarm → Monitor → Update Beads → Next batch
```

### Process-Level Parallelism

For single-agent engines:

```text
bd ready → Spawn N processes in git worktrees → Each pulls tasks → Auto-merge on completion
```

Default N=3, configurable via `--max-parallel`.

### File Locking

Swarm sub-agents must reserve files before editing:

```typescript
interface FileLock {
  path: string;
  taskId: string;
  acquiredAt: Date;
}
```

Conflicts are deferred or re-routed to avoid race conditions.

---

## Error Recovery

| Scenario         | Action                                                   |
| ---------------- | -------------------------------------------------------- |
| Task fails       | Retry up to 3 times (configurable)                       |
| Blocking failure | Mark dependents as `blocked`, continue others            |
| Build breaks     | Auto mode: attempt fix-build meta-task; Hybrid: escalate |
| Rate limit       | Exponential backoff; pause and notify if persistent      |
| Auth failure     | Clear error message with setup instructions              |

All failures logged to `.bemadralphy/failures.log`.

---

## Configuration Files

| File                        | Purpose                                |
| --------------------------- | -------------------------------------- |
| `.bemadralphy/state.yaml`   | Pipeline state                         |
| `.bemadralphy/cost.log`     | Per-task cost tracking                 |
| `.bemadralphy/failures.log` | Error logs                             |
| `intake.yaml`               | Processed intake decisions             |
| `tasks.md`                  | Human-readable task list (regenerated) |

---

## External Dependencies

| Dependency              | Required     | Purpose                                  |
| ----------------------- | ------------ | ---------------------------------------- |
| Node.js 18+ or Bun 1.0+ | Yes          | Runtime                                  |
| Git                     | Yes          | Version control                          |
| Beads CLI (`bd`)        | Yes          | Task graph (installed by `init`)         |
| BMAD                    | Yes          | Planning workflows (installed by `init`) |
| AI engine CLI           | At least one | Execution (claude, cursor, codex, etc.)  |

---

## See Also

- [Onboarding Guide](onboarding.md) — How to set up and run locally
- [ADR-001](adr/001-cli-only.md) — Why CLI-only
- [ADR-002](adr/002-beads-as-task-source.md) — Why Beads for task management
- [ADR-003](adr/003-openspec-living-specs.md) — Why OpenSpec for living specs
