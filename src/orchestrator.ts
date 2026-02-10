import { access, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
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
import { loadState, saveState } from './state.js';
import { generateSpecs } from './specs/index.js';
import { assertCommandExists, runCommand } from './utils/exec.js';
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
  projectRoot?: string;
};

export async function runInit(projectRoot: string = process.cwd()): Promise<void> {
  const bemadDir = path.join(projectRoot, '.bemadralphy');
  const openspecDir = path.join(projectRoot, 'openspec');
  const ideaPath = path.join(projectRoot, 'idea.md');

  await mkdir(bemadDir, { recursive: true });
  await mkdir(path.join(openspecDir, 'specs'), { recursive: true });
  await mkdir(path.join(openspecDir, 'changes', 'archive'), { recursive: true });
  await mkdir(path.join(projectRoot, '_bmad-output', 'stories'), { recursive: true });

  try {
    await access(ideaPath);
  } catch {
    await writeFile(
      ideaPath,
      [
        '# Project Idea',
        '',
        'Describe the product or change request here.',
        '',
        '## Goals',
        '- Goal 1',
        '',
        '## Constraints',
        '- Constraint 1',
        '',
      ].join('\n'),
      'utf-8',
    );
    logInfo('init: created starter idea.md');
  }

  await assertCommandExists('bd', 'Install from https://github.com/steveyegge/beads.');
  await assertCommandExists('bmad', 'Install with: npm install -g bmad-method');
  await assertCommandExists('openspec', 'Install with: npm install -g @fission-ai/openspec');

  await runCommand('bd', ['init'], projectRoot);
  logInfo('init: Beads initialized');
  await generateSpecs(projectRoot);

  logInfo('init: completed scaffold of .bemadralphy, openspec/, and _bmad-output/');
}

export async function runPipeline(options: RunOptions): Promise<void> {
  const projectRoot = options.projectRoot ?? process.cwd();
  const context: PipelineContext = {
    runId: new Date().toISOString(),
    mode: options.mode,
    dryRun: options.dryRun,
    projectRoot,
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
  const projectRoot = process.cwd();
  const state = await loadState(projectRoot);
  if (!state) {
    logInfo('status: no state found (.bemadralphy/state.yaml missing)');
    return;
  }

  logInfo(`status: phase=${state.phase} mode=${state.mode} engine=${state.engine ?? 'n/a'}`);
}

function stateFrom(ctx: PipelineContext, phase: string) {
  return {
    phase,
    mode: ctx.mode,
    engine: ctx.engine,
    startedAt: ctx.runId,
  };
}
