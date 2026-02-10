import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { PipelineContext } from '../phases/types.js';
import { assertCommandExists, runCommand } from '../utils/exec.js';
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

  await assertCommandExists('bmad', 'Install with: npm install -g bmad-method');
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
    const message = (error as Error).message;
    if (isLikelyInteractiveInstallError(message)) {
      logInfo('planning: BMAD install appears interactive; generating fallback planning artifacts');
      await writeFallbackPlanningOutputs(ctx.projectRoot, outputs);
    } else {
      throw error;
    }
  }

  await validateBmadOutputs(outputs);
  logInfo('planning: BMAD outputs validated');
}

function isLikelyInteractiveInstallError(message: string): boolean {
  const lowered = message.toLowerCase();
  return (
    lowered.includes('install to this directory') ||
    lowered.includes('yes / no') ||
    lowered.includes('prompt') ||
    lowered.includes('tty') ||
    lowered.includes('interactive')
  );
}

async function writeFallbackPlanningOutputs(
  projectRoot: string,
  outputs: {
    productBriefPath: string;
    prdPath: string;
    architecturePath: string;
    storiesPath: string;
  },
): Promise<void> {
  const idea = await readIdea(projectRoot);
  await Promise.all([
    writeFile(
      outputs.productBriefPath,
      ['# Product Brief', '', '> Generated fallback because BMAD install required interactive input.', '', idea].join(
        '\n',
      ),
      'utf-8',
    ),
    writeFile(
      outputs.prdPath,
      ['# PRD', '', '> Generated fallback because BMAD install required interactive input.', '', idea].join('\n'),
      'utf-8',
    ),
    writeFile(
      outputs.architecturePath,
      [
        '# Architecture',
        '',
        '> Generated fallback because BMAD install required interactive input.',
        '',
        '## Initial Constraints',
        '- Refine architecture after BMAD becomes available.',
      ].join('\n'),
      'utf-8',
    ),
    writeFile(
      outputs.storiesPath,
      ['# Epics', '', '## Epic 1: Bootstrap', '### Story 1.1: Replace fallback planning outputs with BMAD outputs.'].join(
        '\n',
      ),
      'utf-8',
    ),
  ]);
}

async function readIdea(projectRoot: string): Promise<string> {
  try {
    const raw = await readFile(path.join(projectRoot, 'idea.md'), 'utf-8');
    const trimmed = raw.trim();
    return trimmed.length > 0 ? trimmed : 'No idea.md content found.';
  } catch {
    return 'No idea.md found.';
  }
}
