import { existsSync } from 'node:fs';
import path from 'node:path';
import { runCommandSafe } from '../utils/exec.js';
import { logInfo } from '../utils/logging.js';
import type { PipelineContext } from './types.js';

export async function scaffoldPhase(ctx: PipelineContext): Promise<PipelineContext> {
  logInfo('Phase 4 (scaffold): git init, package.json, configs');
  
  // Initialize git if not already a repo
  const gitDir = path.join(ctx.projectRoot, '.git');
  if (!existsSync(gitDir)) {
    logInfo('scaffold: initializing git repository');
    await runCommandSafe('git', ['init'], ctx.projectRoot);
  }
  
  return ctx;
}
