import { logInfo } from '../utils/logging.js';
import { commandExists, runCommand } from '../utils/exec.js';
import { archiveSpecChange } from '../specs/index.js';
import type { PipelineContext } from './types.js';

export async function postPhase(ctx: PipelineContext): Promise<PipelineContext> {
  logInfo('Phase 8 (post): docs, release, deployment');
  try {
    await archiveSpecChange(ctx.projectRoot);
  } catch (error) {
    logInfo(`post: openspec archive skipped (${(error as Error).message})`);
  }

  if (!ctx.createPr || ctx.dryRun) {
    return ctx;
  }

  const hasGit = await commandExists('git');
  const hasGh = await commandExists('gh');

  if (!hasGit || !hasGh) {
    logInfo('post: --create-pr requested, but git/gh CLI not available; skipping PR checks');
    return ctx;
  }

  try {
    const gitStatus = await runCommand('git', ['status', '--short'], ctx.projectRoot);
    logInfo(`post: git status lines=${gitStatus.stdout.trim() ? gitStatus.stdout.trim().split('\n').length : 0}`);
    await runCommand('gh', ['auth', 'status'], ctx.projectRoot);
    logInfo('post: gh authentication check passed');
  } catch (error) {
    logInfo(`post: git/gh verification failed (${(error as Error).message})`);
  }
  return ctx;
}
