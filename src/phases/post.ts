import { logInfo } from '../utils/logging.js';
import { commandExists, runCommand } from '../utils/exec.js';
import { archiveSpecChange } from '../specs/index.js';
import type { PipelineContext } from './types.js';

export async function postPhase(ctx: PipelineContext): Promise<PipelineContext> {
  logInfo('Phase 8 (post): docs, release, deployment');
  await archiveSpecChange(ctx.projectRoot);

  if (!ctx.createPr || ctx.dryRun) {
    return ctx;
  }

  const hasGit = await commandExists('git');
  const hasGh = await commandExists('gh');

  if (!hasGit || !hasGh) {
    throw new Error('post: --create-pr requires both git and gh CLIs to be installed');
  }

  const gitStatus = await runCommand('git', ['status', '--short'], ctx.projectRoot);
  logInfo(`post: git status lines=${gitStatus.stdout.trim() ? gitStatus.stdout.trim().split('\n').length : 0}`);
  await runCommand('gh', ['auth', 'status'], ctx.projectRoot);
  logInfo('post: gh authentication check passed');
  return ctx;
}
