# BeMadRalphy Architecture

This document describes the architecture of BeMadRalphy v2, including module structure, data flow, internal subsystems, and key design decisions.

---

## Overview

BeMadRalphy is a **self-contained CLI orchestrator** that absorbs functionality from five parent projects into a single binary with no external CLI dependencies:

1. **BMAD-METHOD** -- Planning workflows via embedded prompt templates and direct AI calls
2. **Beads** -- Task schema and dependency resolution via embedded SQLite
3. **Ralphy** -- Execution orchestration, retry logic, and prompt construction patterns
4. **OpenSpec** -- Living spec validation and archive lifecycle via internal engine
5. **Superpowers** -- TDD guardrails, two-stage review, and anti-rationalization patterns

```text
+---------------------------------------------------------------------+
|                         BeMadRalphy CLI                              |
+---------------------------------------------------------------------+
|                          Pipeline Phases                             |
|  +--------+  +--------+  +--------+  +--------+  +--------+        |
|  |Explore |->|Intake  |->|Planning|->|Steering|->|Scaffold|        |
|  +--------+  +--------+  +--------+  +--------+  +--------+        |
|       |           |            |           |           |             |
|       v           v            v           v           v             |
|  +--------+  +--------+  +--------+  +--------+                    |
|  |  Sync  |->|Execute |->| Verify |->|  Post  |                    |
|  +--------+  +--------+  +--------+  +--------+                    |
+---------------------------------------------------------------------+
|                       Internal Subsystems                            |
|  +----------+  +----------+  +----------+  +----------+             |
|  |    AI    |  |  Task    |  |   Spec   |  |  Retry   |             |
|  | Provider |  | Manager  |  |  Engine  |  |  Logic   |             |
|  +----------+  +----------+  +----------+  +----------+             |
|  +----------+  +----------+  +----------+  +----------+             |
|  | Engines  |  |  Swarm   |  |Templates |  |  State   |             |
|  +----------+  +----------+  +----------+  +----------+             |
+---------------------------------------------------------------------+
```

---

## Directory Structure

```text
src/
  cli.ts                       # CLI entry point (commander.js)
  index.ts                     # Programmatic API entry
  orchestrator.ts              # Pipeline orchestration, init, doctor, resume

  ai/                          # Direct AI provider layer
    provider.ts                # AIProvider interface, parseStructuredJson
    anthropic.ts               # Anthropic (Claude) provider
    openai.ts                  # OpenAI provider
    ollama.ts                  # Ollama local-model provider
    index.ts                   # createAIProvider factory with fallback chain

  templates/                   # Embedded prompt templates
    product-brief.prompt.md    # Product brief generation prompt
    prd.prompt.md              # PRD generation prompt
    architecture.prompt.md     # Architecture generation prompt
    stories.prompt.md          # Stories generation prompt (Superpowers-enhanced)
    index.ts                   # Template loader with user-override support
    execution/                 # Execution-phase prompts
      implementer.prompt.md    # Implementer subagent prompt (TDD rules)
      spec-reviewer.prompt.md  # Spec compliance review prompt
      quality-reviewer.prompt.md # Code quality review prompt

  tasks/                       # Embedded task manager (replaces Beads CLI)
    db.ts                      # SQLite setup, schema migration
    manager.ts                 # TaskManager: CRUD, getReady, dependencies
    index.ts                   # Barrel export

  specs/                       # Internal spec engine (replaces OpenSpec CLI)
    generate.ts                # Scaffold openspec/ directories and config
    validate.ts                # Validate spec headers, keywords, scenarios
    delta.ts                   # Merge delta specs
    archive.ts                 # Archive completed changes
    index.ts                   # Barrel export

  execution/                   # Execution utilities
    retry.ts                   # withRetry: exponential backoff, jitter, error classification

  phases/                      # Pipeline phases (executed in order)
    explore.ts                 # Phase 0: Codebase/domain exploration
    intake.ts                  # Phase 1: Read idea.md, Q&A, generate intake.yaml
    planning.ts                # Phase 2: Invoke AI planning pipeline
    steering.ts                # Phase 3: Generate steering files
    scaffold.ts                # Phase 4: git init, package.json, configs
    sync.ts                    # Phase 5: Stories to SQLite tasks + tasks.md
    execute.ts                 # Phase 6: Swarm-aware execution loop
    verify.ts                  # Phase 7: Internal spec validation
    post.ts                    # Phase 8: Code review, docs, deploy
    types.ts                   # PipelineContext type

  planning/                    # Planning utilities
    index.ts                   # runPlanning: AI calls + fallback
    validate.ts                # Validate planning artifact structure

  engines/                     # AI engine adapters for execution
    types.ts                   # EngineAdapter interface
    cli-adapter.ts             # Generic CLI adapter factory with rich prompts
    claude.ts                  # Claude Code adapter
    codex.ts                   # OpenAI Codex adapter
    copilot.ts                 # GitHub Copilot adapter
    cursor.ts                  # Cursor adapter
    gemini.ts                  # Gemini adapter
    kimi.ts                    # Kimi K2.5 adapter
    ollama.ts                  # Ollama local-model adapter
    opencode.ts                # OpenCode adapter
    qwen.ts                    # Qwen adapter
    index.ts                   # Engine registry

  swarm/                       # Native swarm integrations
    detector.ts                # Detect swarm capabilities per engine
    claude-teams.ts            # Claude Agent Teams (TeammateTool)
    kimi-parl.ts               # Kimi K2.5 PARL swarm
    codex-sdk.ts               # Codex Agents SDK
    types.ts                   # Swarm types
    index.ts                   # Barrel export

  steering/                    # Steering file generator
    index.ts                   # Generate AGENTS.md, CLAUDE.md, .cursorrules, etc.

  beads/                       # Legacy adapter utilities
    adapter.ts                 # storiesToTasks conversion
    tasks-md.ts                # tasks.md generation
    writer.ts                  # (Legacy) serialized write queue
    index.ts                   # Barrel export

  plugins/                     # Plugin system
    types.ts                   # Plugin contract
    index.ts                   # Plugin loader/runtime

  state.ts                     # Pipeline state persistence (.bemadralphy/state.yaml)
  history.ts                   # Run history storage (.bemadralphy/runs.jsonl)
  config.ts                    # Config loading (.bemadralphyrc / bemad.config.js)
  cost.ts                      # Cost tracking and budget
  errors.ts                    # Domain error types
  locks.ts                     # File reservation/locking
  permissions.ts               # Engine permission profiles

  utils/
    exec.ts                    # Command execution helpers
    logging.ts                 # Structured logging
```

---

## Data Flow

### Phase 1: Intake

```text
idea.md --> detect greenfield/brownfield --> classify project type
        --> extract existing decisions --> Q&A --> intake.yaml
```

### Phase 2: Planning (Direct AI)

```text
intake.yaml
  --> createAIProvider(Anthropic | OpenAI | Ollama)
  --> loadTemplate('product-brief') --> AI completion --> product-brief.md
  --> loadTemplate('prd')           --> AI completion --> prd.md
  --> loadTemplate('architecture')  --> AI completion --> architecture.md
  --> loadTemplate('stories')       --> AI completion --> stories/*.md
  --> validatePlanningOutputs()
  --> fallback artifact generation on provider failure
```

### Phase 5: Task Sync

```text
stories/*.md --> storiesToTasks() --> TaskManager.create()
             --> addDependency() for cross-story deps
             --> generateTasksMd() --> tasks.md
```

### Phase 6: Execution

```text
TaskManager.getReady()   <-- recursive CTE resolves dependency graph
  --> dispatch to engine adapter
  --> withRetry(adapter.execute(task), { maxAttempts, backoff, classify })
  --> two-stage review loop:
       1. spec-reviewer.prompt.md  --> pass/fail
       2. quality-reviewer.prompt.md --> pass/fail
  --> TaskManager.close(id)  on success
  --> TaskManager.fail(id)   on failure
  --> repeat until no ready tasks
```

### Phase 7: Verify

```text
openspec/specs/**/*.md --> validateSpecs()
  --> check ## Purpose, ## Requirements headers
  --> check SHALL/MUST keywords
  --> check GIVEN/WHEN/THEN scenarios
  --> report pass/fail
```

---

## Key Subsystems

### AI Provider

The `src/ai/` module provides a unified interface for AI model calls during planning:

```typescript
interface AIProvider {
  name: string;
  complete(prompt: string, options?: CompletionOptions): Promise<string>;
}
```

Provider selection uses a fallback chain: Anthropic (if `ANTHROPIC_API_KEY` set) --> OpenAI (if `OPENAI_API_KEY` set) --> Ollama (local, no key needed). The `--model` flag and `.bemadralphyrc` `model` field control which model is used.

### Task Manager (SQLite)

The `src/tasks/` module replaces the external Beads CLI with an embedded SQLite database at `.bemadralphy/tasks.db`:

- **Schema**: `tasks` table (id, title, description, status, metadata, timestamps) + `task_dependencies` table (task_id, depends_on)
- **State machine**: `open` --> `in_progress` --> `closed` | `failed`. `retry()` resets `failed` --> `open`.
- **Ready queue**: `getReady()` uses a recursive CTE (ported from Beads) to return all tasks whose dependencies are fully resolved.
- **Concurrency**: SQLite WAL mode ensures safe concurrent reads during parallel execution.

### Spec Engine

The `src/specs/` module replaces the external OpenSpec CLI:

- **generate**: Scaffolds `openspec/` directories and writes initial config.
- **validate**: Checks spec markdown for required headers (`## Purpose`, `## Requirements`), SHALL/MUST keywords, and GIVEN/WHEN/THEN scenarios.
- **archive**: Validates specs, merges delta changes into main specs, and moves completed changes to `openspec/changes/archive/`.
- **delta**: Merges ADDED/MODIFIED/REMOVED sections into base specs.

### Retry Logic

The `src/execution/retry.ts` module provides `withRetry()`:

- Exponential backoff with configurable base delay and jitter
- Error classification: **retryable** (network timeouts, rate limits, transient failures) vs. **fatal** (auth errors, missing config)
- Configurable max attempts

### Engine Adapters

Each engine adapter implements a common interface:

```typescript
interface EngineAdapter {
  name: string;
  hasNativeSwarm: boolean;
  permissionFlags: string[];
  checkAvailable(): Promise<boolean>;
  execute(task: EngineTask, options: ExecuteOptions): Promise<TaskResult>;
}
```

The generic `createCliAdapter()` factory in `cli-adapter.ts` handles:

- Prompt assembly with project context (reads `AGENTS.md`, `CLAUDE.md`, `.cursorrules` from the target project)
- Explicit execution boundaries ("do not mark task complete until verified")
- Permission flags (e.g., `--dangerously-skip-permissions` for Claude)
- Output parsing and error handling with actionable hints

### Swarm Detection

The swarm detector determines the execution strategy:

1. Explicit `--swarm` override (highest priority)
2. Execution profile policy (`safe` forces process mode)
3. Engine native capability (Claude, Kimi, Codex support native swarm)

Native swarm dispatches a batch of ready tasks to the engine's built-in multi-agent system. Process-level parallelism spawns N processes (configurable via `--max-parallel`) in isolated git worktrees.

### Two-Stage Review

Inspired by Superpowers, the execute phase can run a two-stage review loop on each completed task:

1. **Spec compliance review**: Does the implementation match the task specification? Uses `spec-reviewer.prompt.md`.
2. **Code quality review**: Are there code quality issues (naming, structure, test coverage)? Uses `quality-reviewer.prompt.md`.

Failed reviews can feed corrections back into the execution loop.

### Steering File Generation

Phase 3 generates 14+ steering files for all major AI agents and IDEs:

- `AGENTS.md` -- Universal agent instructions
- `CLAUDE.md` -- Claude-specific rules
- `.cursorrules` -- Cursor rules
- `.windsurfrules` -- Windsurf rules
- `.clinerules` -- Cline rules
- And more for Kiro, Copilot, Codex, etc.

All generated files embed Superpowers methodology patterns: TDD-first, verification-before-completion, anti-rationalization rules, and systematic debugging instructions.

### Template System

The `src/templates/` module manages prompt templates:

- Templates are Markdown files with `{{variable}}` placeholders
- `loadTemplate(name)` reads from `src/templates/` (built-in) or a user override directory
- `renderTemplate(template, vars)` replaces placeholders with context values
- User overrides: place custom templates in the `templates` directory specified in `.bemadralphyrc`

---

## State Management

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
resumeFromPhase: execute
checkpoints:
  intake: completed
  planning: completed
  steering: completed
```

This enables:

- Resuming after interruption (`--resume`)
- Tracking progress across sessions
- Cost monitoring and budget enforcement

Run history is appended to `.bemadralphy/runs.jsonl` (JSONL, append-only, atomic writes) with per-run status, selected options, and replay metadata.

Additional logs:

| File | Purpose |
| --- | --- |
| `.bemadralphy/state.yaml` | Pipeline state and checkpoints |
| `.bemadralphy/tasks.db` | SQLite task database |
| `.bemadralphy/runs.jsonl` | Append-only run history |
| `.bemadralphy/cost.log` | Per-task cost tracking |
| `.bemadralphy/failures.log` | Phase failure details |
| `.bemadralphy/intake.yaml` | Processed intake decisions |
| `tasks.md` | Human-readable task list (regenerated) |

---

## Concurrency Model

### Native Swarm Mode

For engines with native swarm (Claude, Kimi, Codex):

```text
TaskManager.getReady() --> group by epic --> feed batch to swarm
                       --> monitor completion --> update task state --> next batch
```

### Process-Level Parallelism

For single-agent engines:

```text
TaskManager.getReady() --> spawn N processes in git worktrees
                       --> each pulls from ready queue --> auto-merge on completion
```

Default N=3, configurable via `--max-parallel`.

Execution profile guardrails:

- **safe**: Force `maxParallel=1` and process-mode preference
- **balanced**: Cap parallelism to 2 for lower merge/conflict risk
- **fast**: Honor requested parallelism

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

## Error Model

All phases run in fail-fast mode:

- Missing API keys or unavailable engines stop the run immediately with actionable error messages.
- AI provider failures during planning trigger fallback artifact generation.
- Task creation/update failures surface exact context.
- Spec validation failures report which checks failed and in which files.

---

## Plugin System

BeMadRalphy supports plugins for custom engine registration and phase hooks:

```typescript
interface Plugin {
  name: string;
  register(api: PluginAPI): void;
}

interface PluginAPI {
  registerEngine(name: string, adapter: EngineAdapter): void;
  onBeforePhase(phase: string, handler: PhaseHook): void;
  onAfterPhase(phase: string, handler: PhaseHook): void;
}
```

Load plugins via CLI (`--plugin ./my-plugin.mjs`) or config file (`plugins: [...]`).

---

## Architecture Decision Records

| ADR | Title | Status |
| --- | --- | --- |
| [001](adr/001-cli-only.md) | CLI-only, no GUI | Accepted |
| [002](adr/002-beads-as-task-source.md) | Beads as task source (v1) | Superseded by ADR-005 |
| [003](adr/003-openspec-living-specs.md) | OpenSpec living specs (v1) | Superseded by ADR-006 |
| [004](adr/004-direct-ai-replacing-bmad.md) | Direct AI replaces BMAD CLI | Accepted |
| [005](adr/005-embedded-sqlite-replacing-beads.md) | Embedded SQLite replaces Beads CLI | Accepted |
| [006](adr/006-internal-spec-engine-replacing-openspec.md) | Internal spec engine replaces OpenSpec CLI | Accepted |
| [007](adr/007-superpowers-methodology.md) | Superpowers execution methodology | Accepted |

---

## See Also

- [Getting Started](getting-started.md) -- First local run guide
- [Onboarding](onboarding.md) -- Developer setup
- [Positioning](positioning.md) -- Market positioning and ICP
