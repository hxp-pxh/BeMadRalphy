import { access, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { CostTracker } from './cost.js';
import { estimateRunCost } from './cost.js';
import { loadRunConfig } from './config.js';
import { appendRunHistory, findRunHistory, readRunHistory } from './history.js';
import { loadPlugins, runPhaseHooks } from './plugins/index.js';
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
  type AudienceProfile,
  type ExecutionProfile,
  type PipelineMode,
} from './phases/index.js';
import { loadState, saveState } from './state.js';
import { generateSpecs } from './specs/index.js';
import { TaskManager } from './tasks/index.js';
import { commandExists } from './utils/exec.js';
import {
  configureLogger,
  logError,
  logInfo,
  logProgress,
  logSummary,
  type OutputFormat,
} from './utils/logging.js';

export type RunOptions = {
  mode?: PipelineMode;
  engine?: string;
  planningEngine?: string;
  maxParallel?: number;
  executionProfile?: ExecutionProfile;
  audienceProfile?: AudienceProfile;
  budget?: number;
  brownfield?: boolean;
  swarm?: 'native' | 'process' | 'off';
  createPr?: boolean;
  dryRun?: boolean;
  resume?: boolean;
  fromPhase?: PipelinePhaseName;
  toPhase?: PipelinePhaseName;
  output?: OutputFormat;
  plugins?: string[];
  model?: string;
  timeout?: number;
  templates?: {
    productBrief?: string;
    prd?: string;
    architecture?: string;
    stories?: string;
  };
  projectRoot?: string;
};

type RequiredRunOptions = {
  mode: PipelineMode;
  engine?: string;
  planningEngine?: string;
  maxParallel: number;
  executionProfile?: ExecutionProfile;
  audienceProfile?: AudienceProfile;
  budget?: number;
  brownfield: boolean;
  swarm?: 'native' | 'process' | 'off';
  createPr: boolean;
  dryRun: boolean;
  resume: boolean;
  fromPhase?: PipelinePhaseName;
  toPhase?: PipelinePhaseName;
  output: OutputFormat;
  plugins: string[];
  model?: string;
  timeout?: number;
  templates?: {
    productBrief?: string;
    prd?: string;
    architecture?: string;
    stories?: string;
  };
  projectRoot: string;
};

type PipelinePhaseName =
  | 'intake'
  | 'planning'
  | 'steering'
  | 'scaffold'
  | 'sync'
  | 'execute'
  | 'verify'
  | 'post';

type PipelinePhase = {
  name: PipelinePhaseName;
  run: (ctx: PipelineContext) => Promise<PipelineContext>;
};

const PHASES: PipelinePhase[] = [
  { name: 'intake', run: intakePhase },
  { name: 'planning', run: planningPhase },
  { name: 'steering', run: steeringPhase },
  { name: 'scaffold', run: scaffoldPhase },
  { name: 'sync', run: syncPhase },
  { name: 'execute', run: executePhase },
  { name: 'verify', run: verifyPhase },
  { name: 'post', run: postPhase },
];

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

  await TaskManager.create(projectRoot);
  await generateSpecs(projectRoot);
  logInfo('init: initialized internal TaskManager + OpenSpec scaffold');
  logInfo('init: completed scaffold of .bemadralphy, openspec/, and _bmad-output/');
}

export async function runPipeline(options: RunOptions): Promise<void> {
  const normalized = await resolveRunOptions(options);
  configureLogger({ outputFormat: normalized.output });

  const runId = new Date().toISOString();
  configureLogger({ outputFormat: normalized.output, runId });
  logProgress('run', 'start', 'run started', {
    mode: normalized.mode,
    engine: normalized.engine ?? 'claude',
    output: normalized.output,
  });

  const pluginRuntime = await loadPlugins(normalized.projectRoot, normalized.plugins);
  const estimate = await estimateRunCost(normalized.projectRoot, normalized.maxParallel);
  const persistedState = normalized.resume ? await loadState(normalized.projectRoot) : null;
  const startPhase = resolveStartPhase(normalized, persistedState);
  const startIndex = PHASES.findIndex((phase) => phase.name === startPhase);
  if (startIndex < 0) {
    throw new Error(`run: unknown start phase "${startPhase}"`);
  }
  const endPhase = normalized.toPhase;
  const endIndex = endPhase ? PHASES.findIndex((phase) => phase.name === endPhase) : PHASES.length - 1;
  if (endIndex < 0) {
    throw new Error(`run: unknown end phase "${endPhase}"`);
  }
  if (endIndex < startIndex) {
    throw new Error(`run: end phase "${endPhase}" is before start phase "${startPhase}"`);
  }

  if (typeof normalized.budget === 'number' && estimate.minUsd > normalized.budget) {
    throw new Error(
      `run: budget too low for estimate (budget=${normalized.budget.toFixed(2)} min_estimate=${estimate.minUsd.toFixed(2)})`,
    );
  }

  const plannedPhases = PHASES.slice(startIndex, endIndex + 1).map((phase) => phase.name);
  if (normalized.dryRun) {
    logSummary({
      dryRun: true,
      plannedPhases,
      taskCount: estimate.taskCount,
      estimatedUsd: estimate.estimatedUsd,
      estimateRange: [estimate.minUsd, estimate.maxUsd],
      resumeTarget: startPhase,
      heuristic: estimate.heuristic,
    });
    logInfo('run: dry-run complete');
    return;
  }

  await appendRunHistory(normalized.projectRoot, {
    runId,
    startedAt: runId,
    status: 'running',
    mode: normalized.mode,
    engine: normalized.engine,
    output: normalized.output,
    phase: startPhase,
    options: {
      mode: normalized.mode,
      engine: normalized.engine,
      planningEngine: normalized.planningEngine,
      maxParallel: normalized.maxParallel,
      executionProfile: normalized.executionProfile,
      audienceProfile: normalized.audienceProfile,
      budget: normalized.budget,
      brownfield: normalized.brownfield,
      swarm: normalized.swarm,
      createPr: normalized.createPr,
      plugins: normalized.plugins,
    },
    resumeFromPhase: startPhase,
  });

  const context: PipelineContext = {
    runId,
    mode: normalized.mode,
    dryRun: normalized.dryRun,
    projectRoot: normalized.projectRoot,
    engine: normalized.engine,
    planningEngine: normalized.planningEngine,
    maxParallel: normalized.maxParallel,
    executionProfile: normalized.executionProfile,
    audienceProfile: normalized.audienceProfile,
    budget: normalized.budget,
    brownfield: normalized.brownfield,
    swarm: normalized.swarm,
    createPr: normalized.createPr,
    output: normalized.output,
    model: normalized.model,
    timeout: normalized.timeout,
    templates: normalized.templates,
    resume: normalized.resume,
    fromPhase: normalized.fromPhase,
  };
  const cost = new CostTracker();
  let ctx = context;

  for (const phase of PHASES.slice(startIndex, endIndex + 1)) {
    try {
      logProgress('phase', 'start', `${phase.name} phase started`, { phase: phase.name });
      await runPhaseHooks(pluginRuntime.beforeHooks, phase.name, ctx);
      ctx = await phase.run(ctx);
      await runPhaseHooks(pluginRuntime.afterHooks, phase.name, ctx);
      await saveState(ctx.projectRoot, stateFrom(ctx, phase.name, 'running'));
      logProgress('phase', 'done', `${phase.name} phase completed`, { phase: phase.name });
    } catch (error) {
      const message = (error as Error).message;
      logError(`run: phase "${phase.name}" failed`, { phase: phase.name, error: message });
      await saveState(ctx.projectRoot, stateFrom(ctx, phase.name, 'failed', message));
      await appendFailure(ctx.projectRoot, runId, phase.name, message);
      await appendRunHistory(ctx.projectRoot, {
        runId,
        startedAt: runId,
        finishedAt: new Date().toISOString(),
        status: 'failed',
        mode: ctx.mode,
        engine: ctx.engine,
        output: ctx.output,
        phase: phase.name,
        resumeFromPhase: phase.name,
        options: {
          mode: normalized.mode,
          engine: normalized.engine,
          planningEngine: normalized.planningEngine,
          maxParallel: normalized.maxParallel,
          executionProfile: normalized.executionProfile,
          audienceProfile: normalized.audienceProfile,
          budget: normalized.budget,
          brownfield: normalized.brownfield,
          swarm: normalized.swarm,
          createPr: normalized.createPr,
          plugins: normalized.plugins,
        },
        error: message,
      });
      logProgress('phase', 'failed', `${phase.name} phase failed`, {
        phase: phase.name,
        error: message,
      });
      throw error;
    }
  }

  await cost.persist(ctx.projectRoot);
  await saveState(ctx.projectRoot, stateFrom(ctx, PHASES[endIndex]?.name ?? 'post', 'completed'));
  await appendRunHistory(ctx.projectRoot, {
    runId,
    startedAt: runId,
    finishedAt: new Date().toISOString(),
    status: 'completed',
    mode: ctx.mode,
    engine: ctx.engine,
    output: ctx.output,
    phase: PHASES[endIndex]?.name ?? 'post',
    options: {
      mode: normalized.mode,
      engine: normalized.engine,
      planningEngine: normalized.planningEngine,
      maxParallel: normalized.maxParallel,
      executionProfile: normalized.executionProfile,
      audienceProfile: normalized.audienceProfile,
      budget: normalized.budget,
      brownfield: normalized.brownfield,
      swarm: normalized.swarm,
      createPr: normalized.createPr,
      plugins: normalized.plugins,
    },
  });
  logSummary({
    runId: ctx.runId,
    status: 'completed',
    phase: PHASES[endIndex]?.name ?? 'post',
    estimatedUsd: estimate.estimatedUsd,
    taskCount: estimate.taskCount,
  });
  logInfo(`run: completed pipeline (runId=${ctx.runId})`);
}

export async function runExplore(query: string): Promise<void> {
  await explorePhase(query);
}

export async function runStatus(output: OutputFormat = 'text'): Promise<void> {
  configureLogger({ outputFormat: output });
  const projectRoot = process.cwd();
  const state = await loadState(projectRoot);
  if (!state) {
    logInfo('status: no state found (.bemadralphy/state.yaml missing). Run "bemadralphy init" to get started.');
    return;
  }

  if (output === 'json') {
    logSummary({ status: 'ok', state });
    return;
  }
  logInfo(
    `status: phase=${state.phase} status=${state.status ?? 'n/a'} mode=${state.mode} engine=${state.engine ?? 'n/a'}`,
  );
}

export async function runHistory(output: OutputFormat = 'text'): Promise<void> {
  configureLogger({ outputFormat: output });
  const records = await readRunHistory(process.cwd());
  if (output === 'json') {
    logSummary({ runs: records });
    return;
  }
  if (records.length === 0) {
    logInfo('history: no runs found. Run "bemadralphy init" then "bemadralphy run" to create your first run.');
    return;
  }
  for (const row of records) {
    logInfo(
      `history: runId=${row.runId} status=${row.status} phase=${row.phase ?? 'n/a'} mode=${row.mode}`,
    );
  }
}

export async function runReplay(runId: string, options: Partial<RunOptions> = {}): Promise<void> {
  const projectRoot = options.projectRoot ?? process.cwd();
  const record = await findRunHistory(projectRoot, runId);
  if (!record) {
    throw new Error(`replay: run "${runId}" not found`);
  }

  const replayPhaseCandidate = options.fromPhase ?? record.resumeFromPhase ?? record.phase;
  const replayOptions: RunOptions = {
    ...((record.options ?? {}) as RunOptions),
    ...options,
    projectRoot,
    resume: true,
    fromPhase: replayPhaseCandidate && isPipelinePhase(replayPhaseCandidate)
      ? replayPhaseCandidate
      : undefined,
  };
  await runPipeline(replayOptions);
}

export async function runPlanOnly(options: Partial<RunOptions> = {}): Promise<void> {
  await runPipeline({
    ...options,
    fromPhase: 'intake',
    toPhase: 'steering',
  });
}

export async function runExecuteOnly(options: Partial<RunOptions> = {}): Promise<void> {
  await runPipeline({
    ...options,
    fromPhase: 'sync',
    toPhase: 'execute',
  });
}

export async function runResume(options: Partial<RunOptions> = {}): Promise<void> {
  await runPipeline({
    ...options,
    resume: true,
    fromPhase: options.fromPhase,
  });
}

export async function runDoctor(output: OutputFormat = 'text'): Promise<void> {
  configureLogger({ outputFormat: output });
  const hasApiKey = Boolean(process.env.OPENROUTER_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY);
  let sqliteOk = true;
  try {
    await TaskManager.create(process.cwd());
  } catch {
    sqliteOk = false;
  }
  const hasCodingAgent =
    (await commandExists('claude')) ||
    (await commandExists('codex')) ||
    (await commandExists('cursor')) ||
    (await commandExists('opencode')) ||
    (await commandExists('qwen'));
  const checks = await Promise.all([
    checkDependency('node', true, `found ${process.version}`),
    checkDependency('npm', true, 'required for npm-based install/update flows'),
    Promise.resolve({
      name: 'ai_api_keys',
      required: true,
      installed: hasApiKey,
      hint: hasApiKey ? undefined : 'Set OPENROUTER_API_KEY, ANTHROPIC_API_KEY, or OPENAI_API_KEY.',
    }),
    Promise.resolve({
      name: 'sqlite',
      required: true,
      installed: sqliteOk,
      hint: sqliteOk ? undefined : 'Could not initialize .bemadralphy/tasks.db.',
    }),
    Promise.resolve({
      name: 'coding_agent_cli',
      required: true,
      installed: hasCodingAgent,
      hint: hasCodingAgent
        ? undefined
        : 'Install at least one coding agent CLI (claude, codex, cursor, opencode, qwen).',
    }),
    checkDependency('gh', false, 'Install GitHub CLI from https://cli.github.com/'),
    checkDependency('ollama', false, 'Install from https://ollama.com/download for local models.'),
  ]);

  const missingRequired = checks.filter((entry) => entry.required && !entry.installed);
  if (output === 'json') {
    logSummary({
      status: missingRequired.length === 0 ? 'ok' : 'degraded',
      checks,
      missingRequired: missingRequired.map((entry) => entry.name),
    });
    return;
  }

  for (const check of checks) {
    const state = check.installed ? 'ok' : check.required ? 'missing' : 'optional-missing';
    logInfo(`doctor: ${check.name}=${state}${check.hint ? ` (${check.hint})` : ''}`);
  }
  if (missingRequired.length > 0) {
    logInfo(
      `doctor: missing required dependencies (${missingRequired.map((entry) => entry.name).join(', ')}).`,
    );
    return;
  }
  logInfo('doctor: environment looks good for full pipeline runs.');
}

function stateFrom(
  ctx: PipelineContext,
  phase: PipelinePhaseName,
  status: 'running' | 'failed' | 'completed',
  lastError?: string,
) {
  const now = new Date().toISOString();
  const phaseIndex = PHASES.findIndex((entry) => entry.name === phase);
  const nextPhase = phaseIndex >= 0 ? PHASES[phaseIndex + 1]?.name : undefined;
  const resumeFromPhase =
    status === 'completed' ? undefined : status === 'failed' ? phase : nextPhase;
  return {
    phase,
    status,
    lastCompletedPhase: status === 'failed' ? undefined : phase,
    failedPhase: status === 'failed' ? phase : undefined,
    resumeFromPhase,
    lastError,
    mode: ctx.mode,
    engine: ctx.engine,
    executionProfile: ctx.executionProfile,
    audienceProfile: ctx.audienceProfile,
    startedAt: ctx.runId,
    updatedAt: now,
    finishedAt: status === 'completed' ? now : undefined,
    runId: ctx.runId,
    checkpoints: [{ phase, timestamp: now }],
    artifactPaths: {
      brief: '_bmad-output/product-brief.md',
      prd: '_bmad-output/prd.md',
      architecture: '_bmad-output/architecture.md',
      stories: '_bmad-output/stories/epics.md',
    },
  };
}

async function resolveRunOptions(options: RunOptions): Promise<RequiredRunOptions> {
  const projectRoot = options.projectRoot ?? process.cwd();
  const config = await loadRunConfig(projectRoot);
  return {
    mode: normalizeMode(options.mode ?? config.mode),
    engine: options.engine ?? config.engine ?? config.agent,
    planningEngine: options.planningEngine ?? config.planningEngine,
    maxParallel: normalizeMaxParallel(options.maxParallel ?? config.maxParallel),
    executionProfile: normalizeExecutionProfile(options.executionProfile ?? config.executionProfile),
    audienceProfile: normalizeAudienceProfile(options.audienceProfile ?? config.audienceProfile),
    budget: normalizeBudget(options.budget ?? config.budget),
    brownfield: options.brownfield ?? config.brownfield ?? false,
    swarm: options.swarm ?? config.swarm,
    createPr: options.createPr ?? config.createPr ?? false,
    dryRun: options.dryRun ?? false,
    resume: options.resume ?? false,
    fromPhase: options.fromPhase,
    toPhase: options.toPhase,
    output: normalizeOutput(options.output ?? config.output),
    plugins: normalizePlugins(options.plugins ?? config.plugins),
    model: options.model ?? config.model,
    timeout: options.timeout ?? config.timeout,
    templates: options.templates ?? config.templates,
    projectRoot,
  };
}

function normalizeMode(value: PipelineMode | undefined): PipelineMode {
  if (value === 'auto' || value === 'hybrid' || value === 'supervised') {
    return value;
  }
  return 'hybrid';
}

function normalizeExecutionProfile(value: string | undefined): ExecutionProfile | undefined {
  if (value === 'safe' || value === 'balanced' || value === 'fast') {
    return value;
  }
  return undefined;
}

function normalizeAudienceProfile(value: string | undefined): AudienceProfile | undefined {
  if (
    value === 'solo-dev' ||
    value === 'agency-team' ||
    value === 'product-team' ||
    value === 'enterprise-team'
  ) {
    return value;
  }
  return undefined;
}

function normalizeMaxParallel(value: number | undefined): number {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return Math.floor(value);
  }
  return 3;
}

function normalizeBudget(value: number | undefined): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
    return value;
  }
  return undefined;
}

function normalizeOutput(value: OutputFormat | undefined): OutputFormat {
  if (value === 'json') {
    return 'json';
  }
  return 'text';
}

function normalizePlugins(value: string[] | undefined): string[] {
  if (!value) {
    return [];
  }
  return value.filter((entry) => typeof entry === 'string' && entry.trim().length > 0);
}

function resolveStartPhase(
  options: RequiredRunOptions,
  state:
    | {
        resumeFromPhase?: string;
        failedPhase?: string;
        lastCompletedPhase?: string;
      }
    | null,
): PipelinePhaseName {
  if (options.fromPhase && isPipelinePhase(options.fromPhase)) {
    return options.fromPhase;
  }
  if (options.resume && state?.failedPhase && isPipelinePhase(state.failedPhase)) {
    return state.failedPhase;
  }
  if (options.resume && state?.resumeFromPhase && isPipelinePhase(state.resumeFromPhase)) {
    return state.resumeFromPhase;
  }
  if (options.resume && state?.lastCompletedPhase && isPipelinePhase(state.lastCompletedPhase)) {
    const index = PHASES.findIndex((phase) => phase.name === state.lastCompletedPhase);
    return PHASES[index + 1]?.name ?? 'post';
  }
  return 'intake';
}

function isPipelinePhase(value: string): value is PipelinePhaseName {
  return PHASES.some((phase) => phase.name === value);
}

async function appendFailure(
  projectRoot: string,
  runId: string,
  phase: PipelinePhaseName,
  message: string,
): Promise<void> {
  const failuresPath = path.join(projectRoot, '.bemadralphy', 'failures.log');
  await mkdir(path.dirname(failuresPath), { recursive: true });
  await writeFile(
    failuresPath,
    `${new Date().toISOString()} runId=${runId} phase=${phase} error=${message}\n`,
    { encoding: 'utf-8', flag: 'a' },
  );
}

async function checkDependency(
  name: string,
  required: boolean,
  hint?: string,
): Promise<{ name: string; required: boolean; installed: boolean; hint?: string }> {
  if (name === 'node') {
    return { name, required, installed: true, hint };
  }
  const installed = await commandExists(name);
  return { name, required, installed, hint: installed ? undefined : hint };
}

