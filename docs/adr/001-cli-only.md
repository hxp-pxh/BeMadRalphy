# ADR-001: CLI-Only, No GUI

## Status

Accepted

## Date

2026-02-09

## Context

BeMadRalphy is an orchestrator that coordinates AI-powered planning, task management, execution, and specification lifecycle into a single tool. We needed to decide on the user interface approach:

1. **CLI-only** -- Command-line interface with interactive prompts
2. **Web dashboard** -- Browser-based UI for monitoring and control
3. **Desktop app** -- Electron or similar native application
4. **Hybrid** -- CLI for execution, web UI for monitoring

Considerations:

- **Target users**: Developers who are comfortable with terminals
- **Integration**: Must work in CI/CD pipelines and headless environments
- **Development cost**: Limited resources for initial release
- **Composability**: Should integrate with existing developer workflows
- **AI agent compatibility**: Must be invokable by AI coding agents themselves

## Decision

BeMadRalphy will be **CLI-only** with no graphical user interface.

All interaction happens through:

- Command-line commands (`bemadralphy init`, `run`, `plan`, `execute`, `resume`, `status`, `tasks`, `doctor`)
- Interactive terminal prompts (for Q&A and approval gates in hybrid/supervised modes)
- File-based configuration (`idea.md`, `.bemadralphyrc`, `bemad.config.js`)
- File-based state (`.bemadralphy/state.yaml`, `.bemadralphy/tasks.db`)
- Standard output for progress and results (`--output text|json`)

## Consequences

### Positive

- **Simplicity**: Single interface to build and maintain
- **Scriptability**: Easy to integrate into scripts, CI/CD, and automation
- **Headless operation**: Works on servers, containers, and remote machines
- **AI-friendly**: AI agents can invoke BeMadRalphy directly
- **Fast iteration**: No frontend framework, build tooling, or deployment complexity
- **Universal**: Works on any OS with Node.js

### Negative

- **Learning curve**: Users must be comfortable with terminal
- **No visual progress**: No graphs, charts, or visual task boards
- **Limited discoverability**: Commands must be documented; no GUI exploration
- **Accessibility**: May be harder for users who prefer visual interfaces

### Mitigations

- **Rich terminal output**: Colors, progress indicators, and structured JSON output
- **`tasks.md`**: Human-readable task list as a view into the task database
- **`bemadralphy status`**: Quick overview of pipeline state
- **`bemadralphy doctor`**: Environment readiness check
- **Comprehensive docs**: README, getting-started guide, onboarding guide, `--help` for all commands
- **Future option**: A web dashboard could be added as an optional companion tool later

## Related

- [README.md](../../README.md) -- CLI commands documentation
- [docs/getting-started.md](../getting-started.md) -- First local run
- [docs/onboarding.md](../onboarding.md) -- Developer setup
