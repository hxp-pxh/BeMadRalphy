# Getting Started (First Local Run)

This guide is for operators and first-time users who want to run BeMadRalphy end-to-end on a local machine.

If you want to contribute to this repository itself, use the developer guide in `docs/onboarding.md`.

## Prerequisites

Install and verify the required toolchain:

```bash
# Required CLIs
sudo npm install -g ralphy-cli bmad-method @beads/bd @fission-ai/openspec

# Required runtime tools
node --version
npm --version
git --version
```

Confirm CLI availability on `PATH`:

```bash
ralphy --version
bmad --version
bd --version
openspec --version
```

Install BeMadRalphy and verify:

```bash
npm install -g bemadralphy
bemadralphy --version
bemadralphy --help
```

If global install succeeded but command is not found:

```bash
# fallback that always works
npx bemadralphy --help

# optional: add npm global bin to PATH
export PATH="$(npm config get prefix)/bin:$PATH"
```

Optional readiness check:

```bash
bemadralphy doctor
bemadralphy doctor --output json
```

## 10-Minute First Run

### 1) Build this project once

From the BeMadRalphy repo root:

```bash
npm install
npm run build
node dist/cli.js --help
```

### 2) Create a clean test project

```bash
mkdir -p /tmp/bemadralphy-first-run
cd /tmp/bemadralphy-first-run
git init
```

### 3) Initialize BeMadRalphy state

```bash
node /path/to/BMAD-BEADS-RALPHY/dist/cli.js init
```

This command should:

- create `.bemadralphy/`, `openspec/`, and `_bmad-output/`
- create starter `idea.md` if it does not exist
- run required setup integrations (`bd init`, OpenSpec initialization)

If `bd`, `bmad`, `openspec`, or `ralphy` are missing, `init` now completes with warnings and reports what is missing so you can install dependencies incrementally.
When npm is available, `init` also attempts to auto-install missing `bd`, `bmad`, `openspec`, and `ralphy`, and checks existing installs for available npm updates.
If npm packages are already installed globally but commands are unresolved, `init` attempts to create `~/.local/bin` shims for those CLIs.
If BMAD install/update prompts interactively, or if BMAD returns success without producing required output files, planning falls back to generated `_bmad-output` artifacts with explicit markers so the run can continue.

### 4) Add your idea

```bash
cat > idea.md <<'EOF'
A todo app with user accounts, due dates, reminders, and basic analytics.
EOF
```

### 5) Run the full pipeline

```bash
node /path/to/BMAD-BEADS-RALPHY/dist/cli.js run --mode auto --engine ralphy
```

Recommended first-run guardrails:

```bash
node /path/to/BMAD-BEADS-RALPHY/dist/cli.js run \
  --engine ralphy \
  --execution-profile safe \
  --audience-profile product-team
```

Execution profiles:

- `safe`: single-lane defaults for lowest coordination complexity
- `balanced` (default): moderate parallelism for normal use
- `fast`: maximum requested concurrency for speed-focused runs

### 6) Preflight preview before spending tokens

```bash
node /path/to/BMAD-BEADS-RALPHY/dist/cli.js run --dry-run --output json
```

The dry run now prints planned phases, estimated task count, and estimated cost range without running execution phases.

### 7) Resume or replay

```bash
# Resume from latest checkpoint in .bemadralphy/state.yaml
node /path/to/BMAD-BEADS-RALPHY/dist/cli.js run --resume

# View historical runs
node /path/to/BMAD-BEADS-RALPHY/dist/cli.js history

# Replay a previous run from a chosen boundary
node /path/to/BMAD-BEADS-RALPHY/dist/cli.js replay <runId> --from-phase execute
```

## Optional config file

To avoid repeating flags, create `.bemadralphyrc` or `bemad.config.js` in your project root.

Example:

```yaml
mode: hybrid
engine: ralphy
executionProfile: safe
maxParallel: 2
output: text
```

## Expected Outputs Checklist

After a successful run, verify:

- `.bemadralphy/intake.yaml` exists
- `_bmad-output/` contains planning artifacts
- `tasks.md` exists
- `.bemadralphy/state.yaml` exists and reaches `phase: post`

Optional quick checks:

```bash
ls -la .bemadralphy
ls -la _bmad-output
```

## Fail-Fast Troubleshooting

BeMadRalphy is strict by design: required CLI issues fail immediately instead of soft-skipping.

- **Missing CLI error**  
  Install the missing command and re-run version checks.
- **Planning failure (`bmad` command failed)**  
  Run the exact failing `bmad ...` command from the error output in the same directory.
- **Beads failure (`bd` unavailable or issue creation failed)**  
  Verify `bd --version`, then run `bd init` and retry.
- **Engine failure (`ralphy` or engine auth/config issue)**  
  Run the exact failing engine command from the error output and resolve authentication/config.
- **OpenSpec failure (`openspec validate` or `openspec archive`)**  
  Run the failing `openspec ...` command directly to reproduce and fix.

Standard recovery loop:

```bash
# From the BeMadRalphy repo root
npm run verify

# In your target project directory
node /path/to/BMAD-BEADS-RALPHY/dist/cli.js run --mode auto --engine ralphy
```

## Next Steps

- For deeper manual external-boundary validation, see `docs/testing/external-smoke.md`.
- For architecture and module flow, see `docs/architecture.md`.
- For contributor setup and development workflow, see `docs/onboarding.md`.
