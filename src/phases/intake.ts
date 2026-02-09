import { logInfo } from '../utils/logging.js';
import type { PipelineContext } from './types.js';

export async function intakePhase(ctx: PipelineContext): Promise<PipelineContext> {
  logInfo('Phase 1 (intake): read idea.md and generate intake.yaml');
  return ctx;
}
