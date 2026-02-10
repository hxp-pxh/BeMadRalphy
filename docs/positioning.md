# BeMadRalphy Positioning

## Thesis

BeMadRalphy is a product-delivery operating system for AI-assisted software teams. It orchestrates planning, task management, execution, and specification lifecycle into a single self-contained CLI -- no external parent-CLI dependencies required.

The core value is **methodology discipline**, not raw code generation speed.

---

## Target Audience

### Primary ICP

- Product teams with 2-10 engineers shipping features weekly
- Teams that need repeatable intent-to-delivery workflows across contributors and tools

### Secondary ICPs

- Solo developers who want structured delivery without GUI overhead
- Agencies running multiple client projects with consistent delivery playbooks

---

## Differentiation

BeMadRalphy differentiates through:

- **End-to-end flow ownership**: Intake, planning, execution, verification, and post-delivery in a single tool.
- **Single-install experience**: `npm install -g bemadralphy` is the only install. No `bmad`, `bd`, `openspec`, or `ralphy` CLIs needed.
- **Self-contained internals**: Planning runs via direct AI provider calls (Anthropic/OpenAI/Ollama). Task management uses embedded SQLite. Spec lifecycle runs internally. No process shelling to parent tools.
- **BMAD-first design**: Product and architecture intent are first-class inputs, not afterthoughts.
- **Multi-engine execution**: Works with Claude, Cursor, Codex, Kimi, Gemini, Copilot, Ollama, and more -- no vendor lock-in.
- **Living specs and task memory**: Decisions and outcomes stay connected across sessions and brownfield iterations.
- **Superpowers methodology**: TDD guardrails, two-stage review, verification-before-completion, and anti-rationalization patterns are embedded, not optional.

---

## Competitive Landscape

| Category | Examples | BeMadRalphy difference |
| --- | --- | --- |
| Code generation tools | Copilot, Cursor, Claude Code | BeMadRalphy orchestrates these tools; it is not a code generator itself. |
| Project management | Linear, Jira, Notion | BeMadRalphy generates tasks from intent and executes them; PM tools track work for humans. |
| AI agent frameworks | AutoGPT, CrewAI, LangGraph | BeMadRalphy is opinionated about software delivery; agent frameworks are general-purpose. |
| CI/CD platforms | GitHub Actions, CircleCI | BeMadRalphy covers idea-to-delivery; CI/CD covers build-to-deploy. |

---

## Complexity Tax Mitigation

Execution complexity is controlled by explicit guardrail profiles:

- **safe**: Conservative defaults (process preference, `maxParallel=1`)
- **balanced**: Moderate throughput with capped parallelism (`maxParallel<=2`)
- **fast**: Throughput-priority mode that honors requested parallelism

Resolution precedence is deterministic:

1. User override (`--swarm`)
2. Execution profile policy
3. Engine capability

This prevents runaway parallelism from introducing hard-to-debug merge conflicts.

---

## Audience Clarity in Runtime Behavior

Audience assumptions are normalized at intake and persisted:

- `audience_profile`: `solo-dev`, `agency-team`, `product-team`, `enterprise-team`
- `team_size`
- `delivery_velocity`

This shapes planning artifact detail, steering file tone, and execution aggressiveness consistently across a run.

---

## Key Design Principles

### 1. Absorb, Do Not Depend

BeMadRalphy ports the *ideas and algorithms* from parent projects (BMAD, Beads, Ralphy, OpenSpec, Superpowers) rather than shelling out to their CLIs. This means:

- Fewer moving parts for operators
- Deterministic behavior (no external CLI version drift)
- Testable in-process (no subprocess mocking)

### 2. Methodology Over Speed

The pipeline enforces planning before execution, specification before code, and verification before completion. This is slower than "just generate code" but produces more reliable and maintainable outcomes.

### 3. Engine Agnostic

Execution adapters wrap whatever coding agent the team prefers. BeMadRalphy does not privilege any single AI vendor -- it adapts to the team's existing tool choices.

### 4. Fail-Fast, Recover Gracefully

Every phase runs in fail-fast mode with actionable error messages. State persistence and `--resume` ensure that failures do not lose work.

---

## Success Metrics

Recommended metrics to validate positioning:

- **Lead time**: Idea to merged implementation
- **Rework rate**: Percentage of tasks requiring re-execution after verification
- **Story acceptance rate**: Percentage of stories accepted without manual re-planning
- **Context-loss incidents**: Cases where execution diverges from planning intent
- **Onboarding time**: Time from `npm install` to first successful pipeline run
