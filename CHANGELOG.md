# Changelog

<!-- markdownlint-disable MD024 -->

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Checkpoint-oriented orchestration with `--resume` and `--from-phase`
- Dry-run preflight summaries with estimated cost range and planned phase list
- Cost estimation heuristics plus append-only `.bemadralphy/cost.log` entries
- Config file loading from `.bemadralphyrc` / `bemad.config.js`
- Structured output mode via `--output json` and progress event logging
- Run history storage (`.bemadralphy/runs.jsonl`) with `history` and `replay` commands
- Plugin runtime for custom engine registration and before/after phase hooks
- Ollama engine adapter (`--engine ollama`) with `OLLAMA_MODEL` support
- Expanded test coverage for config/history/plugin integration and dry-run behavior

## [2.0.0] - 2026-02-10

### Added

- **AI Provider layer** (`src/ai/`): Direct API integration with Anthropic, OpenAI, and Ollama for planning, with automatic fallback chain
- **Prompt template system** (`src/templates/`): Embedded Markdown templates for product brief, PRD, architecture, and stories generation
- **Execution templates** (`src/templates/execution/`): Superpowers-inspired prompts for implementer, spec reviewer, and quality reviewer subagents
- **Embedded SQLite task manager** (`src/tasks/`): Internal task database at `.bemadralphy/tasks.db` with dependency-aware ready queue using recursive CTE
- **Internal spec engine** (`src/specs/validate.ts`): Spec validation (headers, keywords, scenarios) and archive flow without external CLI
- **Retry logic** (`src/execution/retry.ts`): Exponential backoff with jitter and error classification (retryable vs. fatal)
- **Rich prompt construction** in CLI adapter: Injects project context from `AGENTS.md`, `CLAUDE.md`, `.cursorrules` into engine prompts
- **Two-stage review** in execution phase: Spec compliance review followed by code quality review
- **New CLI commands**: `plan`, `execute`, `resume`, `tasks list/show/retry`, `config set`
- **Superpowers methodology**: TDD guardrails, verification-before-completion, anti-rationalization patterns embedded in steering files
- **ADR-004 through ADR-007**: Architecture decisions documenting the v2 transition

### Changed

- Planning phase uses direct AI provider calls instead of `bmad` CLI shell invocation
- Sync and execute phases use internal `TaskManager` instead of `bd` CLI commands
- Doctor checks validate API keys, SQLite access, and coding agent CLIs instead of parent CLIs
- Init scaffolds internal state, spec, and task infrastructure without auto-installing parent CLIs
- Default execution engine changed from `ralphy` to `claude`
- Engine adapter prompt construction now includes project steering context and execution boundaries
- All documentation rewritten for self-contained v2 architecture

### Removed

- Runtime dependency on external `bmad` CLI
- Runtime dependency on external `bd` (Beads) CLI
- Runtime dependency on external `openspec` CLI
- Runtime dependency on external `ralphy` CLI
- `ralphy` adapter from engine registry (functionality absorbed into `claude` and `cli-adapter`)
- Parent-CLI auto-install, shim bootstrap, and update logic in init

## [0.1.0] - 2026-02-09

### Added

- Initial project scaffold and CLI entry point
- 9-phase pipeline architecture (explore, intake, planning, steering, scaffold, sync, execute, verify, post)
- Engine adapter system with support for Claude, Cursor, Codex, Kimi, Copilot, Gemini, OpenCode, Qwen, Ollama
- Swarm detection and native swarm support for Claude, Kimi, and Codex
- Steering file generation for 14+ AI agents and IDEs
- State persistence and run history
- Comprehensive README, architecture docs, and onboarding guide
- CONTRIBUTING guide with development workflow
- MIT LICENSE and Contributor Covenant Code of Conduct
- Architecture Decision Records (ADR-001 through ADR-003)
- GitHub templates (PR template, bug report, feature request)
- CI/CD workflows (ci, deploy, publish)
- Docker support (Dockerfile, docker-compose.yml)
