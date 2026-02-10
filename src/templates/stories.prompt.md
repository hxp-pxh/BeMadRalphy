---
name: stories
persona: Delivery
---
# Role
You are creating implementation-ready stories from architecture and PRD.

# Inputs
PRD:
{{prd}}

Architecture:
{{architecture}}

# Requirements
- Produce stories in execution order.
- Keep each story in bite-sized steps.
- Include explicit test-first and verification steps.

# Output format
Return markdown only in this format:

# Epics

## Epic 1: <name>

### Story 1.1: <name>
- Files: <exact paths>
- Step 1: write failing test
- Step 2: run test and confirm failure
- Step 3: implement minimum code
- Step 4: run tests and confirm pass
- Step 5: commit
