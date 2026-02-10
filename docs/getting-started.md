# Getting Started

This guide walks you through your first local run of BeMadRalphy. By the end, you will have initialized a project, generated planning artifacts via direct AI calls, and optionally executed tasks through a coding agent.

If you want to contribute to the BeMadRalphy repository itself, see [docs/onboarding.md](onboarding.md).

---

## Prerequisites

BeMadRalphy v2 is self-contained. You need:

| Requirement | Check command |
| --- | --- |
| Node.js 18+ | `node --version` |
| npm | `npm --version` |
| Git | `git --version` |

Plus at least **one AI API key** for planning:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
# or
export OPENAI_API_KEY=sk-...
```

And at least **one coding agent CLI** on PATH for the execution phase:

```bash
claude --version    # or cursor, codex, kimi, gemini, ollama, etc.
```

No external `bmad`, `bd`, `openspec`, or `ralphy` CLIs are required.

### Install BeMadRalphy

```bash
npm install -g bemadralphy
```

Verify:

```bash
bemadralphy --version
bemadralphy --help
```

If the command is not found after global install:

```bash
# Always works without global PATH
npx bemadralphy --help

# Or add npm global bin to PATH
export PATH="$(npm config get prefix)/bin:$PATH"
```

### Check environment readiness

```bash
bemadralphy doctor
bemadralphy doctor --output json
```

Doctor checks: Node, npm, API keys, SQLite access, at least one coding agent CLI, optional `gh` and `ollama`.

---

## 10-Minute First Run

### 1. Create a test project

```bash
mkdir -p /tmp/bemadralphy-first-run
cd /tmp/bemadralphy-first-run
git init
```

### 2. Initialize BeMadRalphy

```bash
bemadralphy init
```

This creates:

- `.bemadralphy/` -- internal state directory with `tasks.db` (SQLite) and `state.yaml`
- `openspec/` -- living spec scaffold (directories and config)
- `_bmad-output/` -- directory for planning artifacts
- `idea.md` -- starter idea file (if not already present)

No external CLIs are installed or invoked during init.

### 3. Write your idea

```bash
cat > idea.md <<'EOF'
A todo app with user accounts, due dates, reminders, and basic analytics.
EOF
```

Or use YAML front-matter for more control:

```yaml
---
project_type: full-stack
stack:
  frontend: Next.js
  backend: Hono
  language: TypeScript
database: Postgres
tests: Vitest
---

A todo app with user accounts, due dates, reminders, and basic analytics.
```

### 4. Preview before spending tokens

```bash
bemadralphy run --dry-run --output json
```

The dry run prints planned phases, estimated task count, and estimated cost range without running any AI calls.

### 5. Run the full pipeline

```bash
bemadralphy run
```

With explicit options:

```bash
bemadralphy run --mode auto --engine claude --execution-profile safe
```

Execution profiles:

- **safe**: Single-lane defaults, lowest coordination risk (recommended for first run)
- **balanced** (default): Moderate parallelism
- **fast**: Maximum requested concurrency

### 6. Resume or replay

If a run is interrupted or fails:

```bash
# Resume from the last checkpoint
bemadralphy resume

# Resume from a specific phase
bemadralphy resume --from execute
```

View and replay past runs:

```bash
bemadralphy history
bemadralphy replay <runId> --from-phase execute
```

---

## Running Planning Only

If you want to generate planning artifacts without executing tasks:

```bash
bemadralphy plan
bemadralphy plan --model claude-sonnet-4-20250514
```

This runs intake + planning + steering and produces:

- `.bemadralphy/intake.yaml`
- `_bmad-output/product-brief.md`
- `_bmad-output/prd.md`
- `_bmad-output/architecture.md`
- `_bmad-output/stories/*.md`
- Steering files (`AGENTS.md`, `CLAUDE.md`, `.cursorrules`, etc.)

---

## Running Execution Only

If planning is already complete and you want to run just the execution phases:

```bash
bemadralphy execute --engine claude
```

This runs sync + execute, converting stories to tasks and dispatching them to the selected engine.

---

## Managing Tasks

```bash
# List all tasks
bemadralphy tasks list

# Filter by status
bemadralphy tasks list --status open
bemadralphy tasks list --status failed

# Show details for a specific task
bemadralphy tasks show <task-id>

# Retry a failed task
bemadralphy tasks retry <task-id>
```

---

## Optional Config File

To avoid repeating flags, create `.bemadralphyrc` in your project root:

```yaml
mode: hybrid
engine: claude
executionProfile: safe
maxParallel: 2
output: text
model: claude-sonnet-4-20250514
```

Or `bemad.config.js`:

```js
export default {
  mode: 'hybrid',
  engine: 'claude',
  output: 'json',
};
```

CLI flags always override config file values.

---

## Expected Outputs

After a successful full run, verify:

| Artifact | Location |
| --- | --- |
| Intake decisions | `.bemadralphy/intake.yaml` |
| Planning artifacts | `_bmad-output/product-brief.md`, `prd.md`, `architecture.md`, `stories/` |
| Task database | `.bemadralphy/tasks.db` |
| Human-readable tasks | `tasks.md` |
| Pipeline state | `.bemadralphy/state.yaml` (should show `phase: post`) |
| Run history | `.bemadralphy/runs.jsonl` |
| Steering files | `AGENTS.md`, `CLAUDE.md`, `.cursorrules`, etc. |

---

## Troubleshooting

### Doctor reports missing API keys

Set at least one planning API key:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
# or
export OPENAI_API_KEY=sk-...
```

### Doctor reports no coding agent CLI

Install at least one coding agent. For example:

```bash
# Claude Code
npm install -g @anthropic-ai/claude-code

# Or use Ollama for local execution
ollama pull llama3.1
```

### Planning fails with provider errors

- Check your API key is valid and has sufficient credits.
- Try a different provider: `bemadralphy plan --model gpt-4o`
- If all providers fail, BeMadRalphy generates fallback planning artifacts with markers so you can fill them in manually.

### Execution fails for selected engine

- Verify the engine CLI is installed: `claude --version`
- Check authentication: ensure the engine is configured and has access.
- The error message includes the exact command that failed -- run it directly to debug.

### General recovery loop

```bash
bemadralphy doctor            # Identify what is missing
# Fix the issue
bemadralphy run               # Re-run the pipeline
```

---

## Next Steps

- For architecture details, see [docs/architecture.md](architecture.md).
- For contributor/developer setup, see [docs/onboarding.md](onboarding.md).
- For smoke testing procedures, see [docs/testing/external-smoke.md](testing/external-smoke.md).
