import {
    executePhase,
    explorePhase,
    intakePhase,
    planningPhase,
    postPhase,
    scaffoldPhase,
    steeringPhase,
    syncPhase,
    verifyPhase,
    type PipelineContext,
    type PipelineMode,
} from './phases/index.js';
import { logInfo } from './utils/logging.js';

export type RunOptions = {
  mode: PipelineMode;
  engine?: string;
  planningEngine?: string;
  maxParallel: number;
  budget?: number;
  brownfield: boolean;
  swarm?: 'native' | 'process' | 'off';
  createPr: boolean;
  dryRun: boolean;
};

export async function runInit(): Promise<void> {
  logInfo('init: not implemented yet');
}

export async function runPipeline(options: RunOptions): Promise<void> {
  const context: PipelineContext = {
    runId: new Date().toISOString(),
    mode: options.mode,
    dryRun: options.dryRun,
  };

  logInfo(`run: starting pipeline (mode=${options.mode})`);
  let ctx = await intakePhase(context);
  ctx = await planningPhase(ctx);
  ctx = await steeringPhase(ctx);
  ctx = await scaffoldPhase(ctx);
  ctx = await syncPhase(ctx);
  ctx = await executePhase(ctx);
  ctx = await verifyPhase(ctx);
  ctx = await postPhase(ctx);

  logInfo(`run: completed pipeline (runId=${ctx.runId})`);
}

export async function runExplore(query: string): Promise<void> {
  await explorePhase(query);
}

export async function runStatus(): Promise<void> {
  logInfo('status: not implemented yet');
}
