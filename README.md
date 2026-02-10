# BeMadRalphy

**Be**(ads) + (B)**Mad** + **Ralphy** + [OpenSpec](https://github.com/Fission-AI/OpenSpec) + [Superpowers](https://github.com/obra/superpowers) -- five parents, one self-contained CLI.

BeMadRalphy is a product-delivery operating system for AI-assisted teams: methodology first, code generation second.

> End-to-end automated coding: idea in, planning, task graph, swarm-aware execution, living specs, deployment out.

[![npm version](https://img.shields.io/npm/v/bemadralphy.svg)](https://www.npmjs.com/package/bemadralphy)
[![npm downloads](https://img.shields.io/npm/dm/bemadralphy.svg)](https://www.npmjs.com/package/bemadralphy)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## Quick Links

- First local run: [docs/getting-started.md](docs/getting-started.md)
- Contributor setup: [docs/onboarding.md](docs/onboarding.md)
- Architecture deep dive: [docs/architecture.md](docs/architecture.md)
- Positioning and ICP: [docs/positioning.md](docs/positioning.md)

---

## What Is BeMadRalphy?

BeMadRalphy v2 is a **self-contained CLI agent**. All planning, task management, specification lifecycle, and execution orchestration run internally -- no external parent CLIs required.

It absorbs the best ideas from five projects:

| Parent | What BeMadRalphy absorbs |
| --- | --- |
| [BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD) | Planning prompts, workflow patterns, agent personas |
| [Beads](https://github.com/steveyegge/beads) | Task schema, dependency resolution, ready-queue algorithm |
| [Ralphy](https://github.com/michaelshimeles/ralphy) | Execution orchestration, retry logic, prompt construction |
| [OpenSpec](https://github.com/Fission-AI/OpenSpec) | Spec templates, validation rules, delta/archive lifecycle |
| [Superpowers](https://github.com/obra/superpowers) | TDD guardrails, two-stage review, anti-rationalization patterns |

The result is a single CLI that takes you from a rough idea to a deployed, documented, and tested codebase with minimal human intervention.

---

## Prerequisites

- **Node.js 18+** (or Bun 1.0+)
- **Git**
- **At least one AI API key** (`ANTHROPIC_API_KEY` or `OPENAI_API_KEY`) for the planning phase
- **At least one coding agent CLI** on PATH (e.g., `claude`, `cursor`, `codex`, `kimi`, `gemini`, `ollama`)
- Optional: `gh` (GitHub CLI) for `--create-pr` support
- Optional: `ollama` for local model execution

No external `bmad`, `bd`, `openspec`, or `ralphy` CLIs are required.

---

## Installation

```bash
# npm (recommended)
npm install -g bemadralphy

# pnpm
pnpm add -g bemadralphy

# bun
bun add -g bemadralphy

# yarn
yarn global add bemadralphy

# or use the install script
curl -fsSL https://raw.githubusercontent.com/hxp-pxh/BeMadRalphy/main/install.sh | bash
```

Verify:

```bash
bemadralphy --version
bemadralphy --help
```

If your shell cannot find `bemadralphy` after global install:

```bash
npx bemadralphy --help

# or add npm global bin to PATH
export PATH="$(npm config get prefix)/bin:$PATH"
```

### Docker

```bash
docker pull ghcr.io/hxp-pxh/bemadralphy:latest
docker run -v $(pwd):/workspace ghcr.io/hxp-pxh/bemadralphy init
```

---

## Quick Start

```bash
# 1. Create a new project directory
mkdir my-awesome-app && cd my-awesome-app

# 2. Initialize BeMadRalphy
npx bemadralphy init

# 3. Write your idea
echo "A todo app with real-time sync and offline support" > idea.md

# 4. Set an API key for planning
export ANTHROPIC_API_KEY=sk-ant-...

# 5. Run the full pipeline
npx bemadralphy run

# 6. Check environment readiness any time
npx bemadralphy doctor
```

BeMadRalphy will:

1. Parse your idea and detect greenfield vs. brownfield
2. Generate a full PRD, architecture, and stories via direct AI calls
3. Create steering files for every major AI agent/IDE
4. Scaffold the project (git, configs, CI)
5. Convert stories to dependency-aware tasks in an embedded SQLite database
6. Execute tasks with retry logic and optional two-stage review
7. Verify the implementation against living specs
8. Generate documentation and deploy

---

## The 9-Phase Pipeline

```text
Phase 0   Phase 1     Phase 2      Phase 3       Phase 4
Explore > Intake    > Planning   > Steering    > Scaffold
                                                    |
Phase 8   Phase 7     Phase 6      Phase 5         v
Post    < Verify    < Execute    < Task Sync  <-----+
```

| Phase | What happens |
| --- | --- |
| **0. Explore** | Optional. Investigate a codebase or problem domain before planning. |
| **1. Intake** | Read `idea.md`, detect greenfield/brownfield, classify project, output `intake.yaml`. |
| **2. Planning** | Direct AI calls generate product brief, PRD, architecture, and stories using embedded templates. |
| **3. Steering** | Generate 14+ steering files for every IDE and agent (Cursor, Claude, Copilot, Windsurf, Cline, Kiro, etc.). |
| **4. Scaffold** | `git init`, monorepo structure, `package.json`, lint/test/CI configs. |
| **5. Task Sync** | Convert stories to tasks in `.bemadralphy/tasks.db` (embedded SQLite) and generate `tasks.md`. |
| **6. Execute** | Swarm-aware execution using the internal ready queue, retry with exponential backoff, and optional two-stage review (spec compliance + code quality). |
| **7. Verify** | Semantic check: completeness, correctness, coherence. Fix-up tasks fed back if needed. |
| **8. Post** | Code review, full documentation suite, living specs, deployment, release management. |

---

## AI Engine Support

BeMadRalphy delegates code execution to whichever coding agent CLI you have installed:

| Engine | Native swarm |
| --- | --- |
| `claude` (default) | Yes |
| `kimi` | Yes |
| `codex` | Yes |
| `cursor` | No |
| `opencode` | No |
| `qwen` | No |
| `copilot` | No |
| `gemini` | No |
| `ollama` | No |

Planning model selection is independent: the planning phase uses the Anthropic, OpenAI, or Ollama API directly (configured via API keys or `--model`).

---

## CLI Commands

```bash
# Initialize a project
bemadralphy init

# Run the full pipeline
bemadralphy run
bemadralphy run --mode auto --engine claude --max-parallel 5 --budget 50

# Run planning phases only (intake + planning + steering)
bemadralphy plan
bemadralphy plan --model claude-sonnet-4-20250514

# Run execution phases only (sync + execute)
bemadralphy execute --engine claude

# Resume a failed or interrupted run
bemadralphy resume
bemadralphy resume --from execute

# Preview pipeline and cost estimate without execution
bemadralphy run --dry-run --output json

# Explore before planning (optional)
bemadralphy explore "How should I structure authentication?"

# Check pipeline status
bemadralphy status

# Show run history
bemadralphy history
bemadralphy history --output json

# Replay a previous run
bemadralphy replay <runId> --from-phase execute

# Check environment readiness
bemadralphy doctor
bemadralphy doctor --output json

# Manage tasks
bemadralphy tasks list
bemadralphy tasks list --status open
bemadralphy tasks show <id>
bemadralphy tasks retry <id>

# Set persistent config
bemadralphy config set engine claude
bemadralphy config set mode auto
```

---

## Autonomy Modes

| Mode | Description |
| --- | --- |
| **Full Autonomous** (`--mode auto`) | Zero pauses after intake Q&A. Everything runs unattended. |
| **Hybrid** (`--mode hybrid`) | Planning gates only (after brief, PRD, architecture, stories). Execution is autonomous. Default. |
| **Supervised** (`--mode supervised`) | Planning gates + execution milestones (after scaffolding, each epic, before deployment). |

---

## The `idea.md` File

BeMadRalphy starts with an `idea.md` file in your project root. It can be as simple or as detailed as you want.

### Minimal example

```markdown
I want to build a SaaS dashboard for tracking fitness goals.
```

### Detailed example with YAML front-matter

```yaml
---
project_type: full-stack
stack:
  frontend: Next.js
  backend: Hono
  language: TypeScript
runtime: bun
monorepo: true
database: Postgres
auth: Clerk
tests: Vitest
deployment: Vercel
---

A SaaS dashboard for tracking fitness goals. Users can log workouts,
track progress over time, set goals, and get AI-powered recommendations.

Key features:
- User authentication with social login
- Workout logging with exercise library
- Progress charts and analytics
- Goal setting and tracking
- AI coach for personalized recommendations
```

BeMadRalphy extracts what you have already decided and only asks about the rest.

---

## Greenfield vs. Brownfield

| Mode | When | What happens |
| --- | --- | --- |
| **Greenfield** | No existing codebase | Full pipeline: idea, PRD, architecture, stories, build from scratch. |
| **Brownfield** | Existing codebase detected | Analyze codebase, generate proposal + spec deltas, skip scaffolding, execute changes. |

Brownfield is auto-detected (looks for `package.json`, `src/`, etc.) or forced with `--brownfield`.

---

## Living Specs

After the initial build, BeMadRalphy generates living specifications in `openspec/specs/`:

```text
openspec/
  specs/
    auth/spec.md
    workouts/spec.md
    goals/spec.md
  changes/
    archive/
```

For subsequent brownfield changes, new requirements are expressed as **delta specs** (ADDED/MODIFIED/REMOVED) against the current specs. On completion, deltas merge into the main specs. All spec validation and archiving runs internally -- no external `openspec` CLI needed.

---

## Target Project Structure

After scaffolding, your project looks like:

```text
your-project/
  .bemadralphy/             # Internal state
    state.yaml              # Pipeline state and checkpoints
    tasks.db                # SQLite task database
    intake.yaml             # Processed intake decisions
    cost.log                # Per-task cost tracking
    failures.log            # Phase failure log
    runs.jsonl              # Append-only run history
  _bmad-output/             # Planning artifacts
    product-brief.md
    prd.md
    architecture.md
    stories/
  openspec/                 # Living specs
    specs/
    changes/
      archive/
  docs/
    adr/                    # Architecture Decision Records
    onboarding.md
    runbook.md
  src/                      # Your application code
  tests/
  .github/
    workflows/
    ISSUE_TEMPLATE/
    pull_request_template.md
  AGENTS.md                 # Universal agent steering
  CLAUDE.md                 # Claude-specific steering
  .cursorrules              # Cursor-specific steering
  idea.md                   # Your original idea
  tasks.md                  # Human-readable task list
  package.json
  README.md
```

---

## Configuration

### State file (`.bemadralphy/state.yaml`)

Tracks pipeline state for resumability:

```yaml
phase: execution
mode: hybrid
engine: claude
last_gate: architecture
tasks_completed: 12
tasks_total: 24
cost_usd: 3.47
status: running
resumeFromPhase: execute
```

Resume and replay behavior:

- `--resume` retries the failed phase when a run fails.
- `--resume` starts at the next phase when the previous phase completed successfully.
- Completed runs clear `resumeFromPhase`, so a later `--resume` starts fresh.
- `replay <runId>` resolves from the latest run-history record for that `runId`.

### Persistent defaults via config file

Define defaults in `.bemadralphyrc` (YAML/JSON) or `bemad.config.js`:

```yaml
# .bemadralphyrc
mode: hybrid
engine: claude
maxParallel: 2
executionProfile: balanced
output: text
model: claude-sonnet-4-20250514
plugins:
  - ./bemad.plugins/local-plugin.mjs
```

```js
// bemad.config.js
export default {
  mode: 'hybrid',
  engine: 'claude',
  output: 'json',
};
```

CLI flags always override config file values.

### Flags reference

| Flag | Description |
| --- | --- |
| `--mode auto\|hybrid\|supervised` | Autonomy mode |
| `--engine <name>` | AI engine for execution |
| `--planning-engine <name>` | Override engine for planning phase only |
| `--model <name>` | Model for direct AI planning calls |
| `--timeout <seconds>` | Task timeout hint |
| `--max-parallel N` | Max parallel tasks (default: 3) |
| `--execution-profile <profile>` | Guardrails: `safe\|balanced\|fast` |
| `--audience-profile <profile>` | ICP: `solo-dev\|agency-team\|product-team\|enterprise-team` |
| `--budget N` | Cost cap in USD |
| `--brownfield` | Force brownfield mode |
| `--swarm native\|process\|off` | Override swarm detection |
| `--create-pr` | Create PRs for each task |
| `--dry-run` | Preflight plan + cost estimate only |
| `--resume` | Resume from latest checkpoint |
| `--from-phase <name>` | Start at a specific phase |
| `--output text\|json` | Human-readable or structured output |
| `--plugin <paths...>` | Load custom plugin modules |

### Execution profiles

- **safe**: Single-lane execution, process-mode bias, lowest coordination risk.
- **balanced** (default): Controlled concurrency for day-to-day product work.
- **fast**: Maximum requested concurrency for throughput-focused runs.

---

## Internal Architecture (High-Level)

```text
  idea.md
     |
     v
  [ AI Provider ] -- Anthropic / OpenAI / Ollama
     |
     v
  [ Planning Templates ] -- product-brief / PRD / architecture / stories
     |
     v
  [ TaskManager ] -- embedded SQLite (.bemadralphy/tasks.db)
     |                 dependency-aware ready queue (recursive CTE)
     v
  [ Engine Adapters ] -- claude / cursor / codex / kimi / gemini / ollama / ...
     |                    rich prompt construction with project context
     v
  [ Retry + Review ] -- exponential backoff, error classification
     |                   two-stage review (spec compliance + code quality)
     v
  [ Spec Engine ] -- internal validate / archive / delta merge
     |
     v
  delivered project
```

For the full module-level walkthrough, see [docs/architecture.md](docs/architecture.md).

---

## Fail-Fast Behavior

BeMadRalphy is strict by design:

- **Init** scaffolds `.bemadralphy/`, `openspec/`, `_bmad-output/`, and starter `idea.md`. No external CLIs are auto-installed.
- **Doctor** checks Node, npm, API keys, SQLite access, and at least one coding agent CLI.
- **Planning** fails if AI provider calls fail and fallback generation cannot produce required artifacts.
- **Sync** fails if stories cannot be parsed or task creation fails.
- **Execute** fails for unknown or unavailable engines.
- **Verify** fails if internal spec validation detects issues.

Recovery is straightforward:

```bash
# Check environment
bemadralphy doctor

# Fix the issue (API key, engine CLI, etc.)
export ANTHROPIC_API_KEY=sk-ant-...

# Re-run
bemadralphy run
```

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on:

- Fork/clone workflow
- Branch naming conventions
- Commit message format (Conventional Commits)
- PR process
- Code standards

---

## License

[MIT](LICENSE) -- Copyright (c) 2026 hxp-pxh

---

## Acknowledgments

BeMadRalphy builds on the shoulders of giants:

- [BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD) -- The planning framework
- [Beads](https://github.com/steveyegge/beads) -- The task graph and dependency model
- [Ralphy](https://github.com/michaelshimeles/ralphy) -- The execution loop and retry patterns ([site](https://ralphy.goshen.fyi/))
- [OpenSpec](https://github.com/Fission-AI/OpenSpec) -- The living spec model
- [Superpowers](https://github.com/obra/superpowers) -- The TDD and review methodology
