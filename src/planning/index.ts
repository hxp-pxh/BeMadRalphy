import { mkdir } from 'node:fs/promises';
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

  await validateBmadOutputs(outputs);
  logInfo('planning: BMAD outputs validated');
}
