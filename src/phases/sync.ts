import { logInfo } from '../utils/logging.js';
import type { PipelineContext } from './types.js';

export async function syncPhase(ctx: PipelineContext): Promise<PipelineContext> {
  logInfo('Phase 5 (sync): convert stories to Beads issues');
  return ctx;
}
