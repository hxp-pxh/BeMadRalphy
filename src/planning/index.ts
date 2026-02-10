import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { PipelineContext } from '../phases/types.js';
import { commandExists, runCommand } from '../utils/exec.js';
import { logInfo } from '../utils/logging.js';
import { validateBmadOutputs } from './validate.js';

export async function runPlanning(ctx: PipelineContext): Promise<void> {
  const outputDir = path.join(ctx.projectRoot, '_bmad-output');
  const storiesDir = path.join(outputDir, 'stories');
  await mkdir(storiesDir, { recursive: true });

  const outputs = {
    productBriefPath: path.join(outputDir, 'product-brief.md'),
    prdPath: path.join(outputDir, 'prd.md'),
    architecturePath: path.join(outputDir, 'architecture.md'),
    storiesPath: path.join(storiesDir, 'epics.md'),
  };

  if (ctx.dryRun) {
    logInfo('planning: dry-run, skipping BMAD invocation');
    return;
  }

  const hasBmad = await commandExists('bmad');
  let generatedFromIntake = false;
  if (hasBmad) {
    try {
      await runCommand(
        'bmad',
        [
          'install',
          '--action',
          'quick-update',
          '--directory',
          ctx.projectRoot,
          '--output-folder',
          '_bmad-output',
          '--tools',
          'none',
          '--yes',
        ],
        ctx.projectRoot,
      );
      logInfo('planning: BMAD install/update completed');
    } catch (error) {
      generatedFromIntake = true;
      logInfo(`planning: BMAD invocation failed; generating local planning docs (${(error as Error).message})`);
    }
  } else {
    generatedFromIntake = true;
    logInfo('planning: BMAD CLI not found; generating local planning docs');
  }

  await writeIfMissing(outputs.productBriefPath, renderProductBrief(ctx));
  await writeIfMissing(outputs.prdPath, renderPrd(ctx));
  await writeIfMissing(outputs.architecturePath, renderArchitecture(ctx));
  await writeIfMissing(outputs.storiesPath, renderStories(ctx));

  await validateBmadOutputs(outputs);
  logInfo(generatedFromIntake ? 'planning: generated planning docs from intake' : 'planning: BMAD outputs validated');
}

async function writeIfMissing(pathname: string, contents: string): Promise<void> {
  try {
    await writeFile(pathname, contents, { flag: 'wx' });
  } catch {
    // File exists; do nothing.
  }
}

function renderProductBrief(ctx: PipelineContext): string {
  return [
    '# Product Brief',
    '',
    '## Problem',
    ctx.intake?.body?.trim() || 'No intake idea was provided.',
    '',
    '## Goals',
    '- Deliver an end-to-end automated implementation pipeline.',
    '- Keep planning, execution, and verification artifacts in version control.',
    '',
    '## Non-Goals',
    '- Replacing the project domain requirements from user intake.',
    '',
    '## Inputs',
    `- Source: ${ctx.intake?.sourceFile ?? 'unknown'}`,
    `- Planning engine: ${ctx.planningEngine ?? 'default'}`,
    '',
  ].join('\n');
}

function renderPrd(ctx: PipelineContext): string {
  return [
    '# PRD',
    '',
    '## Overview',
    ctx.intake?.body?.trim() || 'No intake body provided.',
    '',
    '## User Stories',
    '### Story 1',
    'As a developer, I want the pipeline to transform intake into executable tasks.',
    '',
    '### Story 2',
    'As a reviewer, I want generated artifacts to be validated before execution.',
    '',
    '## Functional Requirements',
    '- Produce product brief, PRD, architecture, and stories in `_bmad-output/`.',
    '- Keep artifacts deterministic and machine-readable.',
    '',
    '## Non-Functional Requirements',
    '- Commands must work in non-interactive CLI execution.',
    '- Execution errors must surface actionable logs.',
    '',
  ].join('\n');
}

function renderArchitecture(ctx: PipelineContext): string {
  return [
    '# Architecture',
    '',
    '## System Overview',
    'BeMadRalphy orchestrates intake, planning, steering, sync, execute, verify, and post phases.',
    '',
    '## Key Components',
    '- CLI orchestrator (`src/cli.ts`, `src/orchestrator.ts`)',
    '- Engine adapters (`src/engines/*`)',
    '- Spec lifecycle (`src/specs/*` + OpenSpec CLI)',
    '',
    '## Data Flow',
    `- Run ID: ${ctx.runId}`,
    '- Intake -> planning artifacts -> task sync -> execution loop -> verification -> post.',
    '',
    '## Decisions',
    '- Prefer real external CLIs when available.',
    '- Preserve generated artifacts for auditability.',
    '',
  ].join('\n');
}

function renderStories(ctx: PipelineContext): string {
  const ideaSummary = ctx.intake?.body?.split('\n').slice(0, 3).join(' ').trim() || 'User-provided idea';
  return [
    '# Epics and Stories',
    '',
    `## Idea Context\n${ideaSummary}`,
    '',
    '### Establish planning baseline',
    '- Ensure BMAD/OpenSpec artifacts are initialized and valid.',
    '',
    '### Execute ready tasks',
    '- Pull `bd ready` tasks and execute with selected engine adapter.',
    '',
    '### Verify and archive changes',
    '- Validate OpenSpec changes and archive completed change sets.',
    '',
  ].join('\n');
}
