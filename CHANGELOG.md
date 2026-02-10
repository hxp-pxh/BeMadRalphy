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

### Changed

- Nothing yet

### Fixed

- Nothing yet

## [2.0.0] - 2026-02-10

### Added

- Direct AI provider layer (Anthropic, OpenAI, Ollama) for planning
- Embedded prompt template system for brief/PRD/architecture/stories
- Internal SQLite task manager at `.bemadralphy/tasks.db`
- Internal spec validation and archive flow without OpenSpec CLI shelling
- Retry helper with exponential backoff and error classification
- New CLI commands: `plan`, `execute`, `resume`, `tasks list/show/retry`, `config set`
- Superpowers-inspired execution templates and steering guardrails
- ADR-004 through ADR-007 documenting v2 architecture decisions

### Changed

- Planning phase now uses direct AI generation instead of `bmad` shell invocation
- Sync/execute phases now use internal task manager instead of `bd` commands
- Doctor checks now validate API keys + internal dependencies instead of parent CLIs
- Init now scaffolds internal state/spec/task infrastructure without auto-installing parent CLIs
- Default engine fallback changed from `ralphy` to `claude`

### Removed

- Runtime dependency on external `bmad` CLI
- Runtime dependency on external `bd` CLI
- Runtime dependency on external `openspec` CLI
- Parent-CLI auto-install and shim bootstrap logic in init

## [0.1.0] - 2026-02-09

### Added

- Initial documentation scaffold
- Comprehensive README with pipeline documentation
- CONTRIBUTING guide with development workflow
- MIT LICENSE
- Contributor Covenant Code of Conduct
- Architecture documentation (`docs/architecture.md`)
- Developer onboarding guide (`docs/onboarding.md`)
- Architecture Decision Records (ADRs):
  - ADR-001: CLI-only, no GUI
  - ADR-002: Beads as task source of truth
  - ADR-003: OpenSpec-compatible living specs
- GitHub templates:
  - Pull request template
  - Bug report issue template
  - Feature request issue template
- `.gitignore` for Node/Bun/Deno projects
- `.editorconfig` for consistent formatting
