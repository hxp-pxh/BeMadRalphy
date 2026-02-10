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
import { commandExists, runCommand } from './utils/exec.js';
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
  output?: OutputFormat;
  plugins?: string[];
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
  output: OutputFormat;
  plugins: string[];
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

  const hasNpm = await commandExists('npm');
  const hasBd = await ensureDependency({
    command: 'bd',
    packageName: '@beads/bd',
    hasNpm,
    cwd: projectRoot,
    installHint: 'Install from https://github.com/steveyegge/beads.',
  });
  const hasBmad = await ensureDependency({
    command: 'bmad',
    packageName: 'bmad-method',
    hasNpm,
    cwd: projectRoot,
    installHint: 'Install with: npm install -g bmad-method',
  });
  const hasOpenSpec = await ensureDependency({
    command: 'openspec',
    packageName: '@fission-ai/openspec',
    hasNpm,
    cwd: projectRoot,
    installHint: 'Install with: npm install -g @fission-ai/openspec',
  });

  if (hasBd) {
    await runCommand('bd', ['init'], projectRoot);
    logInfo('init: Beads initialized');
  } else {
    logInfo('init: bd not found; skipped Beads init. Install from https://github.com/steveyegge/beads.');
  }

  if (hasOpenSpec) {
    await generateSpecs(projectRoot);
  } else {
    logInfo('init: openspec not found; skipped OpenSpec init. Install with: npm install -g @fission-ai/openspec');
  }

  if (!hasBmad) {
    logInfo('init: bmad not found; planning phase will fail until installed (npm install -g bmad-method).');
  }

  const missingRequired = ['bd', 'bmad', 'openspec'].filter((cli) => {
    if (cli === 'bd') {
      return !hasBd;
    }
    if (cli === 'bmad') {
      return !hasBmad;
    }
    return !hasOpenSpec;
  });
  if (missingRequired.length > 0) {
    logInfo(`init: partial setup complete. Missing CLIs: ${missingRequired.join(', ')}`);
  } else {
    logInfo('init: completed scaffold of .bemadralphy, openspec/, and _bmad-output/');
  }
}

export async function runPipeline(options: RunOptions): Promise<void> {
  const normalized = await resolveRunOptions(options);
  configureLogger({ outputFormat: normalized.output });

  const runId = new Date().toISOString();
  configureLogger({ outputFormat: normalized.output, runId });
  logProgress('run', 'start', 'run started', {
    mode: normalized.mode,
    engine: normalized.engine ?? 'ralphy',
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

  if (typeof normalized.budget === 'number' && estimate.minUsd > normalized.budget) {
    throw new Error(
      `run: budget too low for estimate (budget=${normalized.budget.toFixed(2)} min_estimate=${estimate.minUsd.toFixed(2)})`,
    );
  }

  const plannedPhases = PHASES.slice(startIndex).map((phase) => phase.name);
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
    resume: normalized.resume,
    fromPhase: normalized.fromPhase,
  };
  const cost = new CostTracker();
  let ctx = context;

  for (const phase of PHASES.slice(startIndex)) {
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
  await saveState(ctx.projectRoot, stateFrom(ctx, 'post', 'completed'));
  await appendRunHistory(ctx.projectRoot, {
    runId,
    startedAt: runId,
    finishedAt: new Date().toISOString(),
    status: 'completed',
    mode: ctx.mode,
    engine: ctx.engine,
    output: ctx.output,
    phase: 'post',
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
    phase: 'post',
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

export async function runDoctor(output: OutputFormat = 'text'): Promise<void> {
  configureLogger({ outputFormat: output });
  const checks = await Promise.all([
    checkDependency('node', true, `found ${process.version}`),
    checkDependency('npm', true, 'required for npm-based install/update flows'),
    checkDependency('bd', true, 'Install from https://github.com/steveyegge/beads.'),
    checkDependency('bmad', true, 'Install with: npm install -g bmad-method'),
    checkDependency('openspec', true, 'Install with: npm install -g @fission-ai/openspec'),
    checkDependency('ralphy', false, 'Install with: npm install -g ralphy-cli'),
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
      `doctor: missing required CLIs (${missingRequired.map((entry) => entry.name).join(', ')}). Install them before running full pipeline.`,
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
    updatedAt: new Date().toISOString(),
    finishedAt: status === 'completed' ? new Date().toISOString() : undefined,
    runId: ctx.runId,
  };
}

async function resolveRunOptions(options: RunOptions): Promise<RequiredRunOptions> {
  const projectRoot = options.projectRoot ?? process.cwd();
  const config = await loadRunConfig(projectRoot);
  return {
    mode: normalizeMode(options.mode ?? config.mode),
    engine: options.engine ?? config.engine,
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
    output: normalizeOutput(options.output ?? config.output),
    plugins: normalizePlugins(options.plugins ?? config.plugins),
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

type InitDependency = {
  command: 'bd' | 'bmad' | 'openspec';
  packageName: string;
  hasNpm: boolean;
  cwd: string;
  installHint: string;
};

async function ensureDependency(entry: InitDependency): Promise<boolean> {
  let installed = await commandExists(entry.command);

  if (!installed) {
    if (!entry.hasNpm) {
      logInfo(`init: ${entry.command} not found; ${entry.installHint}`);
      return false;
    }
    try {
      logInfo(`init: ${entry.command} not found; attempting install (${entry.packageName})`);
      await runCommand('npm', ['install', '-g', entry.packageName], entry.cwd);
      installed = await commandExists(entry.command);
      if (!installed) {
        logInfo(`init: ${entry.command} install command completed but CLI is still missing on PATH.`);
        return false;
      }
      logInfo(`init: installed ${entry.command} successfully`);
    } catch (error) {
      const message = (error as Error).message;
      logInfo(`init: failed to auto-install ${entry.command}. ${entry.installHint} (${message})`);
      return false;
    }
  }

  if (!entry.hasNpm) {
    logInfo(`init: npm not found; skipping update check for ${entry.command}`);
    return true;
  }

  try {
    const localVersion = await getCliSemver(entry.command);
    const latestVersion = await getPackageLatestSemver(entry.packageName);
    if (localVersion && latestVersion && localVersion !== latestVersion) {
      logInfo(
        `init: updating ${entry.command} from ${localVersion} to ${latestVersion} (${entry.packageName})`,
      );
      await runCommand('npm', ['install', '-g', `${entry.packageName}@latest`], entry.cwd);
      return (await commandExists(entry.command)) === true;
    }
  } catch (error) {
    const message = (error as Error).message;
    logInfo(`init: unable to check updates for ${entry.command}; continuing (${message})`);
  }

  return true;
}

async function getCliSemver(command: string): Promise<string | null> {
  try {
    const { stdout } = await runCommand(command, ['--version']);
    const match = stdout.trim().match(/(\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?)/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

async function getPackageLatestSemver(packageName: string): Promise<string | null> {
  const { stdout } = await runCommand('npm', ['view', packageName, 'version', '--json']);
  const parsed = JSON.parse(stdout.trim()) as string | undefined;
  return typeof parsed === 'string' && parsed.length > 0 ? parsed : null;
}
