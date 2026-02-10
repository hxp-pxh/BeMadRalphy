# Smoke Tests (Local, Opt-In)

This checklist validates BeMadRalphy's end-to-end behavior against real AI providers and coding agents. It is intended for manual local testing and is not required for automated CI.

---

## Prerequisites

- BeMadRalphy built and linked:

  ```bash
  npm install
  npm run build
  npm link
  ```

- At least one AI API key set:

  ```bash
  export ANTHROPIC_API_KEY=sk-ant-...
  # or
  export OPENAI_API_KEY=sk-...
  ```

- At least one coding agent CLI on PATH:

  ```bash
  claude --version    # or cursor, codex, kimi, gemini, ollama, etc.
  ```

- Optional: `gh` (GitHub CLI) for `--create-pr` testing

---

## 1. Environment check

```bash
bemadralphy doctor
bemadralphy doctor --output json
```

Expected:

- `node`, `npm`, `sqlite` show `ok`
- `ai_api_keys` shows `ok` (at least one key set)
- `coding_agent_cli` shows `ok` (at least one engine available)
- `gh` and `ollama` show `ok` or `optional-missing`

---

## 2. Initialize a test project

```bash
mkdir -p /tmp/bemadralphy-smoke && cd /tmp/bemadralphy-smoke
git init
bemadralphy init
```

Expected:

- `.bemadralphy/` directory created with `tasks.db` and `state.yaml`
- `openspec/` directory created with subdirectories
- `_bmad-output/` directory created
- Starter `idea.md` created if not present
- No errors about missing external CLIs

---

## 3. Run planning

```bash
cat > idea.md <<'EOF'
A simple REST API for a bookstore with CRUD operations, user reviews, and search.
EOF

bemadralphy plan
```

Expected:

- `.bemadralphy/intake.yaml` written
- `_bmad-output/product-brief.md` generated (non-empty, valid markdown)
- `_bmad-output/prd.md` generated
- `_bmad-output/architecture.md` generated
- `_bmad-output/stories/` directory with story files
- Steering files generated (`AGENTS.md`, `CLAUDE.md`, `.cursorrules`, etc.)

If AI provider calls fail, fallback artifacts should be generated with explicit markers.

---

## 4. Dry run the full pipeline

```bash
bemadralphy run --dry-run --output json
```

Expected:

- JSON output with `plannedPhases`, `taskCount`, `estimatedUsd`, and `estimateRange`
- No actual execution or token spend

---

## 5. Run full pipeline with execution

```bash
bemadralphy run --engine claude --execution-profile safe
```

Expected:

- Tasks created in `.bemadralphy/tasks.db`
- `tasks.md` generated
- Engine dispatches tasks (visible in output)
- `.bemadralphy/state.yaml` reaches `phase: post`
- Run appended to `.bemadralphy/runs.jsonl`

---

## 6. Task management

```bash
bemadralphy tasks list
bemadralphy tasks list --status closed
```

Expected:

- Tasks listed with id, status, and title
- Closed tasks reflect successful execution

---

## 7. Resume and replay

```bash
# Interrupt a run (Ctrl+C) then:
bemadralphy resume

# View history
bemadralphy history
bemadralphy history --output json

# Replay a previous run
bemadralphy replay <runId> --from-phase execute
```

---

## 8. Post-phase git/gh boundary (optional)

```bash
bemadralphy run --engine claude --create-pr
```

Expected:

- `git status` check runs
- `gh auth status` check runs (if `gh` is installed)
- No destructive git operations

---

## 9. Capture evidence

- Save terminal output
- Capture `.bemadralphy/state.yaml`
- Capture `tasks.md`
- Capture `.bemadralphy/runs.jsonl`
- Note engine versions used

---

## 10. Troubleshooting

If the pipeline fails:

1. Run `bemadralphy doctor` to identify environment issues.
2. Check the error message for the exact failure point and context.
3. Fix the issue (API key, engine config, etc.).
4. Resume: `bemadralphy resume`

For development issues:

```bash
npm run verify
```
