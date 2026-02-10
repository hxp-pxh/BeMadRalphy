# Contributing to BeMadRalphy

Thank you for your interest in contributing to BeMadRalphy! This document provides guidelines and instructions for contributing.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Branch Naming](#branch-naming)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Code Standards](#code-standards)
- [Testing](#testing)
- [Issue Templates](#issue-templates)

---

## Code of Conduct

This project adheres to the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- Git 2.30+
- C/C++ toolchain for `better-sqlite3` native module compilation

### Setup

```bash
# Fork the repository on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/BeMadRalphy.git
cd BeMadRalphy

# Add upstream remote
git remote add upstream https://github.com/hxp-pxh/BeMadRalphy.git

# Install dependencies
npm install

# Verify everything works
npm run verify
```

For detailed development setup, see [docs/onboarding.md](docs/onboarding.md).

---

## Development Workflow

1. **Sync with upstream** before starting work:

   ```bash
   git fetch upstream
   git checkout main
   git merge upstream/main
   ```

2. **Create a feature branch** from `main`:

   ```bash
   git checkout -b feat/your-feature-name
   ```

3. **Make your changes** with tests.

4. **Run checks** before committing:

   ```bash
   npm run verify    # typecheck + lint + test
   ```

5. **Commit** using conventional commits (see below).

6. **Push** and open a PR.

---

## Branch Naming

Use descriptive branch names with prefixes:

| Prefix | Use case |
| --- | --- |
| `feat/` | New features |
| `fix/` | Bug fixes |
| `docs/` | Documentation changes |
| `refactor/` | Code refactoring (no behavior change) |
| `test/` | Adding or updating tests |
| `chore/` | Maintenance tasks, dependencies |

Examples:

- `feat/add-gemini-engine-adapter`
- `fix/retry-backoff-overflow`
- `docs/update-architecture-guide`

---

## Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

```text
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

| Type | Description |
| --- | --- |
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no code change |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf` | Performance improvement |
| `test` | Adding or correcting tests |
| `chore` | Maintenance, dependencies, build |

### Scopes

The module or area affected: `ai`, `tasks`, `specs`, `engines`, `execute`, `planning`, `steering`, `templates`, `swarm`, `cli`, `config`, `docs`.

### Examples

```text
feat(engines): add Gemini adapter with native API support

Implements the Gemini engine adapter using the generativelanguage API.
Supports both single-agent and batch execution modes.

Closes #42
```

```text
fix(tasks): prevent duplicate dependency edges in TaskManager

Adds a UNIQUE constraint on (task_id, depends_on) and uses
INSERT OR IGNORE to handle idempotent dependency creation.

Fixes #57
```

```text
feat(templates): add brownfield analysis prompt template

Adds a new prompt template for analyzing existing codebases
during brownfield intake, extracting architecture patterns
and suggesting minimal-disruption implementation strategies.
```

---

## Pull Request Process

1. **Fill out the PR template** completely.

2. **Link related issues** using keywords (`Closes #123`, `Fixes #456`).

3. **Ensure all checks pass**:
   - TypeScript type check
   - ESLint
   - All tests (37+ tests across 15 test files)
   - Build

4. **Request review** from maintainers.

5. **Address feedback** promptly. Push additional commits; do not force-push during review.

6. **Squash and merge** is the default merge strategy.

### PR Checklist

- [ ] Tests added/updated for changes
- [ ] Documentation updated if needed
- [ ] `npm run verify` passes
- [ ] Commit messages follow conventions
- [ ] PR description explains the "why"

---

## Code Standards

### TypeScript

- **Strict mode** (`"strict": true`)
- **No `any`** unless documented why
- **Explicit return types** for exported functions
- **TSDoc comments** for all exported functions, types, and classes

### TSDoc Example

````typescript
/**
 * Converts planning stories to internal task manager entries.
 *
 * @param stories - Array of story markdown file paths
 * @param manager - TaskManager instance for task creation
 * @returns Array of created task IDs
 * @throws {TaskCreationError} If task creation fails
 *
 * @example
 * ```ts
 * const ids = await storiesToTasks(storyPaths, manager);
 * console.log(ids); // ['story-1-abc123', 'story-2-def456']
 * ```
 */
export async function storiesToTasks(
  stories: string[],
  manager: TaskManager,
): Promise<string[]> {
  // ...
}
````

### Formatting

- **Prettier** for formatting (`prettier.config.mjs`)
- **ESLint** for linting (`eslint.config.mjs`)
- **2 spaces** for indentation
- **Single quotes** for strings
- **Trailing commas** in multiline structures

```bash
npm run format    # Auto-format
npm run lint      # Check lint
```

### File Organization

```text
src/
  cli.ts                # CLI entry point
  orchestrator.ts       # Pipeline orchestration
  ai/                   # AI provider layer
  templates/            # Prompt templates
  tasks/                # SQLite task manager
  specs/                # Spec engine
  execution/            # Retry logic
  phases/               # Pipeline phases
  planning/             # Planning pipeline
  engines/              # Engine adapters
  swarm/                # Swarm integrations
  steering/             # Steering file generation
  beads/                # Story-to-task conversion
  plugins/              # Plugin system
  utils/                # Shared utilities
```

---

## Testing

### Running Tests

```bash
npm test                # All tests
npm run test:watch      # Watch mode
npm run test:coverage   # With coverage
npx vitest run tests/phases/execute.test.ts   # Specific file
```

### Test Structure

- Tests live in `tests/` (mirrors `src/` structure)
- Use descriptive names: `it('closes successful tasks and updates failed tasks')`
- Test both happy path and error cases
- Mock AI providers and engine CLIs (not real API calls in tests)
- Tests use fallback behavior and do not require API keys

### Test Files

| Test file | What it covers |
| --- | --- |
| `tests/orchestrator.test.ts` | Init, doctor, pipeline orchestration |
| `tests/phases/execute.test.ts` | Execution loop, task state transitions |
| `tests/phases/verify-post.test.ts` | Spec validation, post-phase behavior |
| `tests/planning.test.ts` | AI planning pipeline and fallback |
| `tests/sync.test.ts` | Story-to-task sync with TaskManager |
| `tests/engines/adapters.test.ts` | Engine adapter contracts |
| `tests/e2e/pipeline-external-fakes.test.ts` | Full pipeline end-to-end |

### Coverage Targets

- **80%** coverage for new code
- Meaningful tests over coverage numbers

---

## Issue Templates

When opening issues, use the appropriate template:

- **Bug Report**: For bugs and unexpected behavior
- **Feature Request**: For new features and enhancements

Templates are in `.github/ISSUE_TEMPLATE/`.

---

## Questions?

- Open a [Discussion](https://github.com/hxp-pxh/BeMadRalphy/discussions) for questions
- Check existing issues before opening new ones
- See [docs/architecture.md](docs/architecture.md) for system design details

Thank you for contributing!
