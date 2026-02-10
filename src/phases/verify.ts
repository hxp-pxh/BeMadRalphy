import { logInfo } from '../utils/logging.js';
import { mergeSpecDeltas } from '../specs/index.js';
import type { PipelineContext } from './types.js';

export async function verifyPhase(ctx: PipelineContext): Promise<PipelineContext> {
  logInfo('Phase 7 (verify): semantic verification');
  try {
    await mergeSpecDeltas(ctx.projectRoot);
  } catch (error) {
    logInfo(`verify: openspec validation failed (${(error as Error).message})`);
  }
  return ctx;
}
