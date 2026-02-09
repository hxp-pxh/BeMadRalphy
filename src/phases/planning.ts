import { runPlanning } from '../planning/index.js';
import { logInfo } from '../utils/logging.js';
import type { PipelineContext } from './types.js';

export async function planningPhase(ctx: PipelineContext): Promise<PipelineContext> {
  logInfo('Phase 2 (planning): BMAD workflows and validation');
  await runPlanning(ctx);
  return ctx;
}
