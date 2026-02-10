# BeMadRalphy Positioning

## Thesis

BeMadRalphy is a product-delivery operating system for AI-assisted software teams. It orchestrates BMAD, Beads, execution engines, and OpenSpec into a repeatable path from idea to validated delivery.

The core value is methodology discipline, not raw code generation speed.

## Target Audience

Primary ICP:

- Product teams with 2-10 engineers shipping features weekly
- Teams that need repeatable intent-to-delivery workflows across contributors and tools

Secondary ICPs:

- Solo developers who want structure without adding GUI tooling overhead
- Agencies running multiple client projects with consistent delivery playbooks

## Differentiation in a Crowded Space

BeMadRalphy differentiates through:

- End-to-end flow ownership: intake, planning, execution, verification, and post-delivery
- BMAD-first design: product and architecture intent are first-class inputs
- Toolchain interoperability: works with multiple engines instead of locking to one model vendor
- Living specs and task memory: keeps decisions and outcomes connected over time

## Complexity Tax Mitigation

Execution complexity is controlled by explicit guardrail profiles:

- `safe`: conservative defaults (`process` preference, `maxParallel=1`)
- `balanced`: moderate throughput with capped parallelism (`maxParallel<=2`)
- `fast`: throughput-priority mode that honors requested parallelism

Resolution precedence is deterministic:

1. User override (`--swarm`)
2. Execution profile policy
3. Engine capability

## Audience Clarity in Runtime Behavior

Audience assumptions are normalized at intake and persisted:

- `audience_profile`
- `team_size`
- `delivery_velocity`

This improves consistency across planning artifacts and run metadata, making the output more aligned with operator intent.

## Success Metrics

Recommended metrics to validate positioning over time:

- Lead time from idea to merged implementation
- Rework rate after verification
- Story acceptance rate without manual re-planning
- Context-loss incidents between planning and execution
