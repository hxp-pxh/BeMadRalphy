import { CostTracker } from './cost.js';
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
import { saveState } from './state.js';
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
    projectRoot: process.cwd(),
    engine: options.engine,
    planningEngine: options.planningEngine,
    maxParallel: options.maxParallel,
    budget: options.budget,
    brownfield: options.brownfield,
    swarm: options.swarm,
    createPr: options.createPr,
  };

  logInfo(`run: starting pipeline (mode=${options.mode})`);
  const cost = new CostTracker();

  let ctx = await intakePhase(context);
  await saveState(ctx.projectRoot, stateFrom(ctx, 'intake'));

  ctx = await planningPhase(ctx);
  await saveState(ctx.projectRoot, stateFrom(ctx, 'planning'));

  ctx = await steeringPhase(ctx);
  await saveState(ctx.projectRoot, stateFrom(ctx, 'steering'));

  ctx = await scaffoldPhase(ctx);
  await saveState(ctx.projectRoot, stateFrom(ctx, 'scaffold'));

  ctx = await syncPhase(ctx);
  await saveState(ctx.projectRoot, stateFrom(ctx, 'sync'));

  ctx = await executePhase(ctx);
  await saveState(ctx.projectRoot, stateFrom(ctx, 'execute'));

  ctx = await verifyPhase(ctx);
  await saveState(ctx.projectRoot, stateFrom(ctx, 'verify'));

  ctx = await postPhase(ctx);
  await saveState(ctx.projectRoot, stateFrom(ctx, 'post'));

  await cost.persist(ctx.projectRoot);

  logInfo(`run: completed pipeline (runId=${ctx.runId})`);
}

export async function runExplore(query: string): Promise<void> {
  await explorePhase(query);
}

export async function runStatus(): Promise<void> {
  logInfo('status: not implemented yet');
}

function stateFrom(ctx: PipelineContext, phase: string) {
  return {
    phase,
    mode: ctx.mode,
    engine: ctx.engine,
    startedAt: ctx.runId,
  };
}
