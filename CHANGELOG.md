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
