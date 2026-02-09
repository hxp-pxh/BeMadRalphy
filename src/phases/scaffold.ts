import { logInfo } from '../utils/logging.js';
import type { PipelineContext } from './types.js';

export async function scaffoldPhase(ctx: PipelineContext): Promise<PipelineContext> {
  logInfo('Phase 4 (scaffold): git init, package.json, configs');
  return ctx;
}
