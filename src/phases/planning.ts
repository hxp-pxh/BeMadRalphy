import { logInfo } from '../utils/logging.js';
import type { PipelineContext } from './types.js';

export async function planningPhase(ctx: PipelineContext): Promise<PipelineContext> {
  logInfo('Phase 2 (planning): BMAD workflows and validation');
  return ctx;
}
