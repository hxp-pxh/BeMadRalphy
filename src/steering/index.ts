import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { PipelineContext } from '../phases/types.js';

export async function generateSteeringFiles(ctx: PipelineContext): Promise<void> {
  const root = ctx.projectRoot;
  const projectName = path.basename(root);

  await write(root, 'AGENTS.md', agentsMd(projectName));
  await write(root, '.cursorrules', cursorRules());
  await write(root, 'CLAUDE.md', claudeMd());
  await write(root, '.windsurfrules', windsurfRules());
  await write(root, '.clinerules', clineRules());

  await write(root, '.github/copilot-instructions.md', copilotInstructions());
  await write(root, '.env.example', envExample(ctx));

  await write(root, '.cursor/rules/project/steering.mdc', cursorProjectRule());
  await write(root, '.cursor/skills/default.md', cursorSkill());
  await write(root, '.kiro/rules/base.md', kiroRule());
}

async function write(root: string, relativePath: string, contents: string): Promise<void> {
  const filePath = path.join(root, relativePath);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, contents, 'utf-8');
}

function agentsMd(projectName: string): string {
  return `# AGENTS: ${projectName}

## Mission
Build and maintain ${projectName} according to the plan and BeMadRalphy conventions.

## Task Source
- BeMadRalphy TaskManager (\`.bemadralphy/tasks.db\`) is the single source of truth for tasks.
- Only mark tasks complete after tests pass.

## Iron Laws
- NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST.
- NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE.
- NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST.

## Two-Stage Review
- Stage 1: spec compliance review (did we build exactly what was requested?)
- Stage 2: code quality review (is it maintainable and safe?)
- Do not move to next task until both stages pass.

## Code Standards
- Add TSDoc/JSDoc for all exported symbols.
- Prefer clear, explicit naming over cleverness.
- Keep modules focused and composable.

## Git Strategy
- Branch-per-task: \`bemadralphy/<task-slug>\`
- Commit-per-task with Beads ID in message.
- Never force-push to \`main\`.

## Environment
- Never commit \`.env\`.
- Use \`.env.example\` for required variables.

## Testing
- Run lint + typecheck + tests before marking tasks complete.
- Follow Red-Green-Refactor for behavior changes.
`;
}

function cursorRules(): string {
  return `# Cursor Rules

- Follow AGENTS.md for all coding conventions.
- Keep changes minimal and focused.
- Add tests when behavior changes.
- Never claim completion without running verification commands.
`;
}

function claudeMd(): string {
  return `# CLAUDE Rules

- Follow AGENTS.md for conventions.
- Use the internal TaskManager for task tracking.
- Do not commit \`.env\`.
- Enforce TDD and verification-before-completion.
`;
}

function windsurfRules(): string {
  return `# Windsurf Rules

- Follow AGENTS.md for conventions and task policy.
`;
}

function clineRules(): string {
  return `# Cline Rules

- Follow AGENTS.md for conventions and task policy.
`;
}

function copilotInstructions(): string {
  return `# GitHub Copilot Instructions

- Follow AGENTS.md.
- Keep changes scoped to the current task.
- Add tests for behavior changes.
`;
}

function cursorProjectRule(): string {
  return `# Project Rules

Follow AGENTS.md. This project uses internal SQLite task tracking and a branch-per-task workflow.
`;
}

function cursorSkill(): string {
  return `# Default Skill

You are an agent working on a CLI-only TypeScript project.
Follow AGENTS.md, keep changes small, and add tests as needed.
`;
}

function kiroRule(): string {
  return `# Kiro Rule

Follow AGENTS.md for conventions and task policy.
`;
}

function envExample(ctx: PipelineContext): string {
  const lines = ['# Example environment variables', 'EXAMPLE_VAR=change-me'];
  if (ctx.intake?.frontmatter && Object.keys(ctx.intake.frontmatter).length > 0) {
    lines.push('', '# Intake decisions (for reference)');
    for (const [key, value] of Object.entries(ctx.intake.frontmatter)) {
      lines.push(`# ${key}: ${String(value)}`);
    }
  }
  return `${lines.join('\n')}\n`;
}
