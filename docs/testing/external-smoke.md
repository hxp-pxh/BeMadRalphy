# External Smoke Tests (Local, Opt-In)

This checklist validates the real external CLI boundaries used by the pipeline.
It is intended for manual local smoke testing and is not required for automated CI.

## Prerequisites

- Install dependencies: `npm install`
- Build once: `npm run build`
- Ensure these CLIs are installed and on `PATH`:
  - `ralphy`
  - `bd`
  - `bmad`
  - `openspec`
  - optional engine-specific CLIs (`claude`, `codex`, `cursor`, `kimi`, etc.)
  - optional: `gh` (required only when using `--create-pr`)

## 1) Initialize a test repo

```bash
mkdir -p /tmp/bemadralphy-smoke && cd /tmp/bemadralphy-smoke
git init
node /path/to/BMAD-BEADS-RALPHY/dist/cli.js init
```

Expected:

- `.bemadralphy/`, `openspec/`, `_bmad-output/` created
- starter `idea.md` created if missing

## 2) Provide a minimal idea and run pipeline

Edit `idea.md` with a short project request, then run:

```bash
node /path/to/BMAD-BEADS-RALPHY/dist/cli.js run --mode auto --engine ralphy
```

Expected:

- `.bemadralphy/intake.yaml` written
- `_bmad-output/*` files present (BMAD bootstrap + generated planning artifacts)
- `tasks.md` generated
- `.bemadralphy/state.yaml` with `phase: post`

## 3) Exercise Beads integration

```bash
bd ready
```

Expected:

- pipeline has created/updated Beads tasks during sync and execute phases

## 4) Exercise post-phase git/gh boundary (optional)

Run with PR checks enabled:

```bash
node /path/to/BMAD-BEADS-RALPHY/dist/cli.js run --engine ralphy --create-pr
```

Expected:

- `git status --short` check runs
- `gh auth status` check runs (if `gh` installed/authenticated)
- no destructive git operations are performed

## 5) Capture evidence

- Save terminal output
- Capture final `.bemadralphy/state.yaml`
- Capture `tasks.md`
- Note installed CLI versions (`ralphy --version`, `bd --version`, `bmad --version`, `openspec --version`)
