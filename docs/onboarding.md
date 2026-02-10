# Developer Onboarding Guide

Welcome to BeMadRalphy! This guide covers everything you need to develop, test, and contribute to the BeMadRalphy repository.

> If you want to use BeMadRalphy to run a pipeline in your own project, start with [docs/getting-started.md](getting-started.md) instead.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Running Locally](#running-locally)
- [Running Tests](#running-tests)
- [Project Structure](#project-structure)
- [Key Modules](#key-modules)
- [Code Conventions](#code-conventions)
- [Common Tasks](#common-tasks)
- [Troubleshooting](#troubleshooting)
- [Getting Help](#getting-help)

---

## Prerequisites

| Tool | Version | Check command |
| --- | --- | --- |
| Node.js | 18+ | `node --version` |
| npm | 9+ | `npm --version` |
| Git | 2.30+ | `git --version` |

### Native module compilation

The task manager uses `better-sqlite3`, which requires a C/C++ toolchain to build native bindings:

- **macOS**: `xcode-select --install`
- **Ubuntu/Debian**: `sudo apt install build-essential python3`
- **Fedora/RHEL**: `sudo dnf groupinstall "Development Tools"`
- **Windows**: Install [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)

### Optional for real AI calls

Tests use fallback behavior and do not require API keys. For real planning runs during development:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
# or
export OPENAI_API_KEY=sk-...
```

---

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/hxp-pxh/BeMadRalphy.git
cd BeMadRalphy
```

### 2. Install dependencies

```bash
npm install
```

### 3. Build

```bash
npm run build
```

### 4. Link for local testing

```bash
npm link
```

Now `bemadralphy` is available globally from your terminal.

### 5. Verify

```bash
npm run verify    # typecheck + lint + test
bemadralphy --version
```

---

## Running Locally

### Development mode (watch)

```bash
npm run dev
```

Runs the TypeScript compiler in watch mode. Changes to `src/` are automatically recompiled.

### Run the CLI directly

```bash
# Via tsx (no build needed)
npx tsx src/cli.ts --help

# Via compiled output
node dist/cli.js --help
```

### Test against a sample project

```bash
mkdir ~/test-project && cd ~/test-project
bemadralphy init
echo "A simple todo app with local storage" > idea.md

# Run planning only (no engine needed)
bemadralphy plan

# Full pipeline with an engine
bemadralphy run --engine claude --execution-profile safe

# Dry run (no tokens spent)
bemadralphy run --dry-run --output json

# Resume from checkpoint
bemadralphy resume
```

---

## Running Tests

### All tests

```bash
npm test
```

Tests live in the `tests/` directory.

### Watch mode

```bash
npm run test:watch
```

### Coverage

```bash
npm run test:coverage
```

### Specific file

```bash
npx vitest run tests/phases/execute.test.ts
```

### Pattern match

```bash
npx vitest run -t "should extract stack decisions"
```

### Full verification (what CI runs)

```bash
npm run verify
```

This runs `typecheck` + `lint` + `test` in sequence.

---

## Project Structure

```text
BeMadRalphy/
  src/
    cli.ts                # CLI entry point (commander.js)
    orchestrator.ts       # Pipeline orchestration, init, doctor
    ai/                   # AI provider layer (Anthropic, OpenAI, Ollama)
    templates/            # Embedded prompt templates for planning + execution
    tasks/                # SQLite task manager (replaces Beads CLI)
    specs/                # Internal spec engine (replaces OpenSpec CLI)
    execution/            # Retry logic with backoff and error classification
    phases/               # Pipeline phases (explore through post)
    planning/             # Planning pipeline and validation
    engines/              # AI engine adapters (claude, cursor, codex, etc.)
    swarm/                # Native swarm integrations
    steering/             # Steering file generation
    beads/                # Story-to-task adapter and tasks.md generation
    plugins/              # Plugin system
    state.ts              # Pipeline state persistence
    history.ts            # Run history
    config.ts             # Config file loading
    cost.ts               # Cost tracking

  tests/
    phases/               # Phase-level tests
    engines/              # Engine adapter tests
    e2e/                  # End-to-end pipeline tests
    planning/             # Planning validation tests
    helpers/              # Test utilities

  docs/
    architecture.md       # System architecture
    getting-started.md    # First-run guide
    onboarding.md         # This file
    positioning.md        # Market positioning
    adr/                  # Architecture Decision Records
    testing/              # Smoke test procedures
```

### Key files to know

| File | Purpose |
| --- | --- |
| `src/cli.ts` | CLI commands and flag definitions |
| `src/orchestrator.ts` | Pipeline orchestration, `runInit`, `runDoctor`, `runPipeline` |
| `src/ai/provider.ts` | `AIProvider` interface for planning calls |
| `src/tasks/manager.ts` | `TaskManager` with SQLite CRUD and ready queue |
| `src/engines/types.ts` | `EngineAdapter` interface for execution |
| `src/engines/cli-adapter.ts` | Generic CLI adapter factory with rich prompt construction |
| `src/execution/retry.ts` | `withRetry` utility with exponential backoff |
| `src/specs/validate.ts` | Internal spec validation rules |
| `src/templates/index.ts` | Template loading and rendering |
| `src/phases/execute.ts` | Execution loop with retry and two-stage review |

---

## Key Modules

### AI Provider (`src/ai/`)

Direct API integration for planning. Supports Anthropic, OpenAI, and Ollama with automatic fallback. Used by the planning phase to generate product briefs, PRDs, architecture, and stories.

### Task Manager (`src/tasks/`)

Embedded SQLite database at `.bemadralphy/tasks.db`. Provides task CRUD, dependency tracking, and a dependency-aware ready queue using a recursive CTE ported from Beads.

### Spec Engine (`src/specs/`)

Internal implementation of spec scaffolding, validation, and archiving. Checks for required headers, SHALL/MUST keywords, and GIVEN/WHEN/THEN scenarios. Replaces all `openspec` CLI calls.

### Engine Adapters (`src/engines/`)

Each adapter wraps a coding agent CLI (Claude, Cursor, Codex, etc.) behind a common interface. The `cli-adapter.ts` factory generates adapters with rich prompt construction that injects project context from steering files.

### Execution (`src/phases/execute.ts` + `src/execution/retry.ts`)

The execution loop pulls ready tasks from the TaskManager, dispatches to the selected engine with retry logic, and optionally runs two-stage review (spec compliance + code quality).

### Templates (`src/templates/`)

Markdown prompt templates with `{{variable}}` placeholders for planning and execution. Supports user overrides via a configured templates directory.

---

## Code Conventions

### TypeScript

- **Strict mode** (`"strict": true`)
- **No implicit `any`**
- **TSDoc comments** on all exported functions, types, and classes
- **Explicit return types** for exported functions

### Style

- **2 spaces** for indentation
- **Single quotes** for strings
- **Trailing commas** in multiline structures
- **Prettier** for formatting (`prettier.config.mjs`)
- **ESLint** for linting (`eslint.config.mjs`)

### Naming

- **kebab-case** for files: `cli-adapter.ts`, `retry.ts`
- **PascalCase** for classes and types: `TaskManager`, `EngineAdapter`
- **camelCase** for functions and variables: `storiesToTasks`, `taskCount`

### Commits

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```text
feat(tasks): add dependency cycle detection
fix(execute): prevent retry on fatal auth errors
docs: rewrite architecture guide for v2
```

Scopes: `ai`, `tasks`, `specs`, `engines`, `execute`, `planning`, `steering`, `cli`, `docs`, `swarm`, `templates`.

---

## Common Tasks

### Add a new engine adapter

1. Create `src/engines/new-engine.ts`
2. Use `createCliAdapter()` from `cli-adapter.ts` with the engine's command name, args builder, and hints
3. Register in `src/engines/index.ts`
4. Add to `tests/engines/adapters.test.ts`
5. Update README engine table

### Add a new pipeline phase

1. Create `src/phases/new-phase.ts`
2. Export the phase function matching the `PipelineContext` signature
3. Wire into the phase list in `src/orchestrator.ts`
4. Add tests in `tests/phases/`
5. Update architecture docs

### Add a new planning template

1. Create `src/templates/my-template.prompt.md`
2. Use `{{variable}}` placeholders for dynamic content
3. Load via `loadTemplate('my-template')` in the planning code
4. Add to the template index if needed

### Add a new AI provider

1. Create `src/ai/new-provider.ts` implementing the `AIProvider` interface
2. Add to the fallback chain in `src/ai/index.ts`
3. Add tests

### Add a plugin

1. Create a plugin module (`plugins/my-plugin.mjs`)
2. Export `{ name, register(api) }`
3. Use `api.registerEngine(...)` for custom engines or `api.onBeforePhase(...)` / `api.onAfterPhase(...)` for hooks
4. Load with `--plugin ./plugins/my-plugin.mjs` or via config

### Update steering file templates

Templates are in `src/steering/index.ts`. Each template takes `intake.yaml` + planning outputs and returns file content with embedded Superpowers methodology patterns.

---

## Troubleshooting

### "Command not found: bemadralphy"

Link the package:

```bash
npm link
```

Or run directly:

```bash
npx tsx src/cli.ts --help
```

### Tests fail with "Cannot find module"

Rebuild:

```bash
npm run build
```

### TypeScript errors after pulling

Dependencies may have changed:

```bash
npm install
npm run build
```

### `better-sqlite3` build fails

Ensure you have a C/C++ toolchain installed (see [Prerequisites](#prerequisites)).

### Engine adapter not working

Check that the engine CLI is installed and authenticated:

```bash
claude --version
cursor --version
```

The error message includes the exact command that failed. Run it directly to debug.

---

## Getting Help

- **Questions?** Open a [Discussion](https://github.com/hxp-pxh/BeMadRalphy/discussions)
- **Found a bug?** Open an [Issue](https://github.com/hxp-pxh/BeMadRalphy/issues)
- **Want to contribute?** See [CONTRIBUTING.md](../CONTRIBUTING.md)

---

## Next Steps

1. Read the [Architecture](architecture.md) guide to understand the system
2. Browse the [ADRs](adr/) to understand key decisions
3. Pick a [good first issue](https://github.com/hxp-pxh/BeMadRalphy/labels/good%20first%20issue)
