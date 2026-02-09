# ADR-003: OpenSpec-Compatible Living Specifications

## Status

Accepted

## Date

2026-02-09

## Context

After BeMadRalphy builds a project, there's a gap: the PRD and architecture are snapshots from planning time, but they don't evolve with the codebase. When making future changes (brownfield mode), there's no "source of truth" to express changes against.

We needed a specification model that:

1. Evolves with the codebase (living documentation)
2. Supports incremental changes (deltas, not rewrites)
3. Works for both greenfield and brownfield
4. Is human-readable and AI-parseable
5. Provides an audit trail of changes

Options considered:

1. **OpenSpec model** — Living specs with delta-based changes
2. **Keep PRD updated** — Manually update PRD after each change
3. **Code as spec** — Tests and types are the specification
4. **No formal spec** — Just documentation and comments
5. **Custom spec format** — Build our own specification system

## Decision

Adopt the **OpenSpec-compatible living specification model**.

After initial build, BeMadRalphy generates specifications in `openspec/specs/`:

```
openspec/
├── specs/
│   ├── auth/spec.md
│   ├── workouts/spec.md
│   └── goals/spec.md
├── changes/
│   └── archive/
```

For brownfield changes, new requirements are expressed as **delta specs** (ADDED/MODIFIED/REMOVED) against current specs. On completion, deltas merge into main specs.

## Consequences

### Positive

- **Living documentation**: Specs evolve with code, never stale
- **Delta-based changes**: Express what's changing, not rewrite everything
- **Audit trail**: Completed changes archived with full context
- **Brownfield support**: Clear model for incremental changes
- **Semantic verification**: Can verify implementation against specs
- **OpenSpec compatibility**: Users can use OpenSpec tools if desired
- **Structured format**: GIVEN/WHEN/THEN scenarios are testable

### Negative

- **Additional artifacts**: More files to maintain
- **Generation complexity**: Must generate specs from PRD + code
- **Merge complexity**: Delta merging requires careful implementation
- **Learning curve**: Users must understand the spec format

### Mitigations

- **Auto-generation**: Specs generated automatically in Phase 8
- **Delta automation**: BeMadRalphy handles delta creation and merging
- **Clear format**: Markdown with structured sections is readable
- **Optional**: Users can ignore specs if they prefer PRD-only

## Specification Format

### Domain Spec (`openspec/specs/auth/spec.md`)

```markdown
# Authentication

## Overview

User authentication via email/password and OAuth providers.

## Requirements

### REQ-AUTH-001: User Registration

Users can create an account with email and password.

**Scenarios:**

- GIVEN a valid email and password
- WHEN the user submits the registration form
- THEN a new account is created
- AND a verification email is sent

### REQ-AUTH-002: OAuth Login

Users can sign in with Google or GitHub.

...
```

### Delta Spec (for brownfield changes)

```markdown
# Authentication Changes

## ADDED

### REQ-AUTH-010: Two-Factor Authentication

Users can enable 2FA via authenticator app.

## MODIFIED

### REQ-AUTH-001: User Registration

- ADDED: Password strength requirements (min 12 chars, mixed case)

## REMOVED

None
```

## Implementation

### Phase 8: Generate Initial Specs

After greenfield build:
1. Parse PRD for requirements
2. Parse architecture for domain boundaries
3. Analyze implemented code for actual behavior
4. Generate `openspec/specs/<domain>/spec.md` for each domain

### Brownfield: Delta Flow

1. User describes change in `idea.md`
2. BeMadRalphy generates proposal + delta spec
3. Delta spec shows ADDED/MODIFIED/REMOVED against current specs
4. After execution, deltas merge into main specs
5. Original change archived to `openspec/changes/archive/`

### Semantic Verification (Phase 7)

Verify implementation against specs:
- **Completeness**: All requirements have corresponding code
- **Correctness**: Implementation matches spec intent
- **Coherence**: Design decisions reflected in code

## Alternatives Considered

### Keep PRD Updated

Rejected because:
- PRD is a planning document, not a living spec
- No structured format for requirements
- No delta model for changes
- Becomes stale quickly

### Code as Spec

Rejected because:
- Tests verify behavior, not intent
- Types don't capture business requirements
- No human-readable requirements document
- Hard to understand "what should this do?"

### No Formal Spec

Rejected because:
- No source of truth for brownfield changes
- Can't verify implementation against intent
- Documentation drifts from reality

### Custom Spec Format

Rejected because:
- OpenSpec already exists and is well-designed
- Compatibility with OpenSpec tools is valuable
- No need to reinvent

## Related

- [OpenSpec documentation](https://github.com/Fission-AI/OpenSpec)
- [docs/architecture.md](../architecture.md) — Spec management module
- [ADR-002](002-beads-as-task-source.md) — Task management (separate from specs)
