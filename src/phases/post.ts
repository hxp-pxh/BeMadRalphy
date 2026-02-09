import { logInfo } from '../utils/logging.js';
import type { PipelineContext } from './types.js';

export async function postPhase(ctx: PipelineContext): Promise<PipelineContext> {
  logInfo('Phase 8 (post): docs, release, deployment');
  return ctx;
}
