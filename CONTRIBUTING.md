# Contributing to BeMadRalphy

Thank you for your interest in contributing to BeMadRalphy! This document provides guidelines and instructions for contributing.

> **Note:** The repository contains initial scaffolding, but many commands are still placeholders. The workflow below describes the intended contribution process as implementation progresses.

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

This project adheres to the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to the maintainers.

---

## Getting Started

### Prerequisites

- Node.js 18+ or Bun 1.0+
- Git
- npm (recommended)

### Setup (scaffolding stage)

```bash
# Fork the repository on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/BeMadRalphy.git
cd BeMadRalphy

# Add upstream remote
git remote add upstream https://github.com/hxp-pxh/BeMadRalphy.git

# Install dependencies
npm install

# Run tests to verify setup
npm test
```

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

4. **Run checks** before committing (once available):

   ```bash
   npm run lint
   npm run typecheck
   npm test
   ```

5. **Commit** using conventional commits (see below).

6. **Push** and open a PR.

---

## Branch Naming

Use descriptive branch names with prefixes:

| Prefix      | Use case                              |
| ----------- | ------------------------------------- |
| `feat/`     | New features                          |
| `fix/`      | Bug fixes                             |
| `docs/`     | Documentation changes                 |
| `refactor/` | Code refactoring (no behavior change) |
| `test/`     | Adding or updating tests              |
| `chore/`    | Maintenance tasks, dependencies       |

Examples:

- `feat/add-kimi-engine-adapter`
- `fix/beads-writer-race-condition`
- `docs/update-onboarding-guide`

---

## Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/). Format:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

| Type       | Description                                             |
| ---------- | ------------------------------------------------------- |
| `feat`     | New feature                                             |
| `fix`      | Bug fix                                                 |
| `docs`     | Documentation only                                      |
| `style`    | Formatting, no code change                              |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf`     | Performance improvement                                 |
| `test`     | Adding or correcting tests                              |
| `chore`    | Maintenance, dependencies, build                        |

### Scope (optional)

The module or area affected: `intake`, `planning`, `steering`, `scaffold`, `execute`, `verify`, `post`, `engines`, `swarm`, `beads`, `docs`, `cli`.

### Examples

```
feat(engines): add Kimi K2.5 adapter

Implements the Kimi K2.5 engine adapter using the HTTP API.
Supports both single-agent and Agent Swarm (PARL) modes.

Closes #42
```

```
fix(beads): serialize writer operations to prevent JSONL conflicts

Adds a single-writer queue for all bd close/update operations.

Fixes #57
```

### Linking Beads Issues

If you're working on a task tracked in Beads, include the Beads ID in your commit:

```
feat(scaffold): generate vitest config (bd-a1b2)
```

---

## Pull Request Process

1. **Fill out the PR template** completely.

2. **Link related issues** using keywords (`Closes #123`, `Fixes #456`).

3. **Ensure all checks pass**:
   - Lint
   - Type check
   - Tests
   - Build

4. **Request review** from maintainers.

5. **Address feedback** promptly. Push additional commits; don't force-push during review.

6. **Squash and merge** is the default merge strategy.

### PR Checklist

- [ ] Tests added/updated for changes
- [ ] Documentation updated if needed
- [ ] Lint and type checks pass
- [ ] Commit messages follow conventions
- [ ] PR description explains the "why"

---

## Code Standards

### TypeScript

- **Strict mode** enabled (`"strict": true` in tsconfig)
- **No `any`** unless absolutely necessary (and documented why)
- **Explicit return types** for exported functions
- **TSDoc comments** for all exported functions, types, and classes

### TSDoc Example

````typescript
/**
 * Converts BMAD stories to Beads issues.
 *
 * @param stories - Array of story markdown file paths
 * @param options - Conversion options
 * @returns Array of created Beads issue IDs
 * @throws {BeadsWriteError} If Beads operations fail
 *
 * @example
 * ```ts
 * const ids = await storiesToBeads(['story-1.md', 'story-2.md']);
 * console.log(ids); // ['bd-a1b2', 'bd-c3d4']
 * ```
 */
export async function storiesToBeads(
  stories: string[],
  options?: ConversionOptions,
): Promise<string[]> {
  // ...
}
````

### Formatting

- **Prettier** for formatting (config in `prettier.config.mjs`)
- **ESLint** for linting (config in `eslint.config.mjs`)
- **2 spaces** for indentation
- **Single quotes** for strings
- **Trailing commas** in multiline

Run formatting:

```bash
npm run format
```

### File Organization

```
src/
├── cli.ts              # CLI entry point
├── phases/             # Pipeline phases
│   ├── explore.ts
│   ├── intake.ts
│   ├── planning.ts
│   ├── steering.ts
│   ├── scaffold.ts
│   ├── sync.ts
│   ├── execute.ts
│   ├── verify.ts
│   └── post.ts
├── engines/            # AI engine adapters
├── swarm/              # Native swarm integrations
├── beads/              # Beads integration
├── docs/               # Documentation generators
├── scaffold/           # Config generators
├── specs/              # Living spec management
└── utils/              # Shared utilities
```

---

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- src/phases/intake.test.ts
```

### Test Structure

- Tests live next to source files: `foo.ts` → `foo.test.ts`
- Use descriptive test names: `it('should extract stack decisions from YAML front-matter')`
- Test both happy path and error cases
- Mock external dependencies (AI engines, file system, Beads CLI)

### Coverage Targets

- **80%** coverage for new code
- Don't sacrifice meaningful tests for coverage numbers

---

## Issue Templates

When opening issues, please use the appropriate template:

- **Bug Report**: For bugs and unexpected behavior
- **Feature Request**: For new features and enhancements

Templates are in `.github/ISSUE_TEMPLATE/`.

---

## Questions?

- Open a [Discussion](https://github.com/hxp-pxh/BeMadRalphy/discussions) for questions
- Check existing issues before opening new ones
- Join the community chat (link TBD)

Thank you for contributing!
