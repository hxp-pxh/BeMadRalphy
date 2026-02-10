# ADR-003: OpenSpec-Compatible Living Specifications

## Status

**Superseded** by [ADR-006](006-internal-spec-engine-replacing-openspec.md)

## Date

2026-02-09

## Context

After BeMadRalphy builds a project, there is a gap: the PRD and architecture are snapshots from planning time, but they do not evolve with the codebase. When making future changes (brownfield mode), there is no source of truth to express changes against.

We needed a specification model that:

1. Evolves with the codebase (living documentation)
2. Supports incremental changes (deltas, not rewrites)
3. Works for both greenfield and brownfield
4. Is human-readable and AI-parseable
5. Provides an audit trail of changes

## Decision (v1)

Adopt the **OpenSpec-compatible living specification model** using the external OpenSpec CLI.

After initial build, BeMadRalphy generates specifications in `openspec/specs/`:

```text
openspec/
  specs/
    auth/spec.md
    workouts/spec.md
    goals/spec.md
  changes/
    archive/
```

For brownfield changes, new requirements are expressed as **delta specs** (ADDED/MODIFIED/REMOVED) against current specs. On completion, deltas merge into main specs.

## Superseded (v2)

In v2, this decision was superseded by [ADR-006](006-internal-spec-engine-replacing-openspec.md). The external OpenSpec CLI dependency was replaced by an internal spec engine (`src/specs/`) that implements:

- **Scaffold**: Create `openspec/` directories and initial config
- **Validate**: Check spec markdown for required headers (`## Purpose`, `## Requirements`), SHALL/MUST keywords, and GIVEN/WHEN/THEN scenarios
- **Archive**: Validate specs, merge delta changes, and move completed changes to `openspec/changes/archive/`
- **Delta merge**: Process ADDED/MODIFIED/REMOVED sections

The spec format, directory structure, and delta model remain OpenSpec-compatible. Only the tooling execution moved from external CLI calls to in-process operations.

## Specification Format

The spec format remains unchanged from v1:

### Domain Spec (`openspec/specs/auth/spec.md`)

```markdown
# Authentication

## Purpose

User authentication via email/password and OAuth providers.

## Requirements

### REQ-AUTH-001: User Registration

Users can create an account with email and password.

**Scenarios:**

- GIVEN a valid email and password
- WHEN the user submits the registration form
- THEN a new account is created
- AND a verification email is sent
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

## Related

- [ADR-006](006-internal-spec-engine-replacing-openspec.md) -- Internal spec engine replaces OpenSpec CLI
- [OpenSpec documentation](https://github.com/Fission-AI/OpenSpec) -- Original inspiration
- [docs/architecture.md](../architecture.md) -- Spec Engine details
