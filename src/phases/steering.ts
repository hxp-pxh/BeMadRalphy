import { logInfo } from '../utils/logging.js';
import type { PipelineContext } from './types.js';

export async function steeringPhase(ctx: PipelineContext): Promise<PipelineContext> {
  logInfo('Phase 3 (steering): generate agent steering files');
  return ctx;
}
