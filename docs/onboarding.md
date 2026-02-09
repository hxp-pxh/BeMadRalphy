# Developer Onboarding Guide

Welcome to BeMadRalphy! This guide will help you get set up for local development.

> **Note:** The repository contains initial scaffolding, but many commands are still placeholders. The commands below are **planned** for when implementation matures.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Running Locally](#running-locally)
- [Running Tests](#running-tests)
- [Directory Walkthrough](#directory-walkthrough)
- [Key Conventions](#key-conventions)
- [Common Tasks](#common-tasks)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have the following installed:

| Tool    | Version | Check command    |
| ------- | ------- | ---------------- |
| Node.js | 18+     | `node --version` |
| npm     | 9+      | `npm --version`  |
| Git     | 2.30+   | `git --version`  |

Optional (for testing engine integrations):

- Claude CLI (`claude --version`)
- Cursor CLI
- Codex CLI

---

## Setup (planned)

### 1. Clone the repository

```bash
git clone https://github.com/hxp-pxh/BeMadRalphy.git
cd BeMadRalphy
```

### 2. Install dependencies

```bash
npm install
```

### 3. Build the project

```bash
npm run build
```

### 4. Link for local testing

```bash
npm link
```

Now you can run `bemadralphy` from anywhere.

### 5. Verify setup

```bash
npm test
bemadralphy --version
```

---

## Running Locally (planned)

### Development mode (with watch)

```bash
npm run dev
```

This runs the TypeScript compiler in watch mode. Changes to `src/` are automatically recompiled.

### Run the CLI directly

```bash
# Using tsx
npm run dev -- --help

# Or after building
node dist/cli.js --help
```

### Test against a sample project

```bash
# Create a test directory
mkdir ~/test-project && cd ~/test-project

# Initialize BeMadRalphy
bemadralphy init

# Create an idea file
echo "A simple todo app with local storage" > idea.md

# Run in dry-run mode (no actual execution)
bemadralphy run --dry-run
```

---

## Running Tests (planned)

### Run all tests

```bash
npm test
```

### Run tests in watch mode

```bash
npm run test:watch
```

### Run tests with coverage

```bash
npm run test:coverage
```

### Run a specific test file

```bash
npm test -- src/phases/intake.test.ts
```

### Run tests matching a pattern

```bash
npm test -- -t "should extract stack decisions"
```

---

## Directory Walkthrough

```
BeMadRalphy/
├── src/                    # Source code
│   ├── cli.ts              # CLI entry point
│   ├── phases/             # Pipeline phases (the core logic)
│   ├── engines/            # AI engine adapters
│   ├── swarm/              # Native swarm integrations
│   ├── beads/              # Beads integration
│   ├── specs/              # Living spec management
│   ├── docs/               # Documentation generators
│   └── scaffold/           # Config generators
│
├── tests/                  # Test utilities and fixtures
│   ├── fixtures/           # Sample files for testing
│   └── helpers/            # Test helper functions
│
├── docs/                   # Project documentation
│   ├── architecture.md     # This architecture doc
│   ├── onboarding.md       # You are here
│   └── adr/                # Architecture Decision Records
│
├── .github/                # GitHub templates and workflows
│   ├── workflows/          # CI/CD pipelines
│   └── ISSUE_TEMPLATE/     # Issue templates
│
├── package.json            # Project manifest
├── tsconfig.json           # TypeScript configuration
├── vitest.config.ts        # Test configuration
├── eslint.config.mjs       # Linting rules
└── prettier.config.mjs     # Formatting rules
```

### Key files to know

| File                   | Purpose                                     |
| ---------------------- | ------------------------------------------- |
| `src/cli.ts`           | CLI entry point; defines commands and flags |
| `src/phases/*.ts`      | Each phase of the pipeline                  |
| `src/engines/types.ts` | Common interface for engine adapters        |
| `src/state.ts`         | Pipeline state management                   |

---

## Key Conventions

### Code style

- **TypeScript strict mode** — No implicit any, strict null checks
- **TSDoc comments** — All exported functions must have TSDoc
- **2 spaces** — For indentation
- **Single quotes** — For strings
- **Trailing commas** — In multiline structures

### File naming

- **kebab-case** for files: `intake.ts`, `claude-teams.ts`
- **PascalCase** for classes: `BeadsWriter`, `EngineAdapter`
- **camelCase** for functions/variables: `storiesToBeads`, `taskCount`

### Test naming

- Tests live next to source: `foo.ts` → `foo.test.ts`
- Use descriptive names: `it('should extract stack decisions from YAML front-matter')`

### Commit messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(intake): add support for YAML front-matter parsing
fix(beads): prevent race condition in writer queue
docs: update onboarding guide with test instructions
```

---

## Common Tasks

### Add a new engine adapter

1. Create `src/engines/new-engine.ts`
2. Implement the `EngineAdapter` interface
3. Register in `src/engines/index.ts`
4. Add tests in `src/engines/new-engine.test.ts`
5. Update README with engine support

### Add a new pipeline phase

1. Create `src/phases/new-phase.ts`
2. Export the phase function
3. Wire into the orchestrator in `src/cli.ts`
4. Add tests
5. Update architecture docs

### Update steering file templates

Templates are in `src/phases/steering.ts`. Each template is a function that takes `intake.yaml` + planning outputs and returns file content.

### Debug a failing test

```bash
# Run with verbose output
npm test -- --reporter=verbose src/phases/intake.test.ts

# Run with debugger
node --inspect-brk node_modules/.bin/vitest run src/phases/intake.test.ts
```

---

## Troubleshooting

### "Command not found: bemadralphy"

Make sure you've linked the package:

```bash
npm link
```

Or run directly:

```bash
npm run dev -- --help
```

### Tests failing with "Cannot find module"

Rebuild the project:

```bash
npm run build
```

### TypeScript errors after pulling

Dependencies may have changed:

```bash
npm install
npm run build
```

### Engine adapter not working

Check that the engine CLI is installed and authenticated:

```bash
claude --version
claude auth status
```

---

## Getting Help

- **Questions?** Open a [Discussion](https://github.com/hxp-pxh/BeMadRalphy/discussions)
- **Found a bug?** Open an [Issue](https://github.com/hxp-pxh/BeMadRalphy/issues)
- **Want to contribute?** See [CONTRIBUTING.md](../CONTRIBUTING.md)

---

## Next Steps

1. Read the [Architecture](architecture.md) doc to understand the system
2. Browse the [ADRs](adr/) to understand key decisions
3. Pick a [good first issue](https://github.com/hxp-pxh/BeMadRalphy/labels/good%20first%20issue) to start contributing
