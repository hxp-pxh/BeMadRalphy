# ADR-001: CLI-Only, No GUI

## Status

Accepted

## Date

2026-02-09

## Context

BeMadRalphy is an orchestrator that coordinates multiple AI-powered development tools (BMAD, Beads, Ralphy-style execution, OpenSpec). We needed to decide on the user interface approach:

1. **CLI-only** — Command-line interface with interactive prompts
2. **Web dashboard** — Browser-based UI for monitoring and control
3. **Desktop app** — Electron or similar native application
4. **Hybrid** — CLI for execution, web UI for monitoring

Considerations:

- **Target users**: Developers who are comfortable with terminals
- **Integration**: Must work in CI/CD pipelines and headless environments
- **Development cost**: Limited resources for initial release
- **Composability**: Should integrate with existing developer workflows
- **AI agent compatibility**: Must be invokable by AI coding agents themselves

## Decision

BeMadRalphy will be **CLI-only** with no graphical user interface.

All interaction happens through:
- Command-line commands (`bemadralphy init`, `run`, `status`, `explore`)
- Interactive terminal prompts (for Q&A and approval gates)
- File-based configuration (`idea.md`, `intake.yaml`, `.bemadralphy/state.yaml`)
- Standard output for progress and results

## Consequences

### Positive

- **Simplicity**: Single interface to build and maintain
- **Scriptability**: Easy to integrate into scripts, CI/CD, and automation
- **Headless operation**: Works on servers, containers, and remote machines
- **AI-friendly**: AI agents can invoke BeMadRalphy directly
- **Fast iteration**: No frontend framework, build tooling, or deployment complexity
- **Universal**: Works on any OS with Node.js/Bun

### Negative

- **Learning curve**: Users must be comfortable with terminal
- **No visual progress**: No graphs, charts, or visual task boards
- **Limited discoverability**: Commands must be documented; no GUI exploration
- **Accessibility**: May be harder for users who prefer visual interfaces

### Mitigations

- **Rich terminal output**: Use colors, spinners, and progress bars
- **`tasks.md`**: Human-readable task list as a "view" into Beads
- **`bemadralphy status`**: Quick overview of pipeline state
- **Comprehensive docs**: README, onboarding guide, `--help` for all commands
- **Future option**: A web dashboard could be added as an optional companion tool later, but the CLI remains the primary interface

## Alternatives Considered

### Web Dashboard

Rejected because:
- Adds significant development and maintenance burden
- Requires hosting/deployment decisions
- Not usable in headless environments
- Overkill for the primary use case (developer running locally)

### Desktop App

Rejected because:
- Even higher development cost (Electron, Tauri, etc.)
- Platform-specific concerns
- Not usable in CI/CD or by AI agents

### Hybrid (CLI + Web)

Deferred. Could be added later as an optional monitoring layer, but the CLI must be fully functional standalone.

## Related

- [README.md](../../README.md) — CLI commands documentation
- [docs/onboarding.md](../onboarding.md) — How to use the CLI
