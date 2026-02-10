import { engineAdapters } from '../engines/index.js';
import { runClaudeTeamsBatch } from '../swarm/claude-teams.js';
import { runCodexAgentsBatch } from '../swarm/codex-sdk.js';
import { resolveExecutionPolicy } from '../swarm/detector.js';
import { runKimiParlBatch } from '../swarm/kimi-parl.js';
import { BeadsWriter } from '../beads/writer.js';
import { assertCommandExists, runCommand } from '../utils/exec.js';
import { logInfo } from '../utils/logging.js';
import type { PipelineContext } from './types.js';

export async function executePhase(ctx: PipelineContext): Promise<PipelineContext> {
  logInfo('Phase 6 (execute): swarm-aware task execution');
  if (ctx.dryRun) {
    logInfo('execute: dry-run, skipping');
    return ctx;
  }

  const engineName = ctx.engine ?? 'ralphy';
  const adapter = engineAdapters[engineName];
  if (!adapter) {
    throw new Error(`execute: unknown engine "${engineName}"`);
  }

  const policy = resolveExecutionPolicy(engineName, ctx.executionProfile ?? 'balanced', {
    swarmOverride: ctx.swarm,
    requestedParallel: ctx.maxParallel,
  });
  logInfo(
    `execute: engine=${engineName} profile=${policy.profile} swarm=${policy.swarmMode} maxParallel=${policy.maxParallel}`,
  );

  if (policy.swarmMode === 'native') {
    if (engineName === 'claude') {
      await runClaudeTeamsBatch(ctx.projectRoot, policy.maxParallel);
    } else if (engineName === 'kimi') {
      await runKimiParlBatch(ctx.projectRoot, policy.maxParallel);
    } else if (engineName === 'codex') {
      await runCodexAgentsBatch(ctx.projectRoot, policy.maxParallel);
    } else {
      await runBdReadyLoop(ctx, adapter);
    }
  } else if (policy.swarmMode === 'process') {
    await runBdReadyLoop(ctx, adapter);
  } else {
    await runBdReadyLoop(ctx, adapter);
  }
  return ctx;
}

async function runBdReadyLoop(
  ctx: PipelineContext,
  adapter: (typeof engineAdapters)[string],
): Promise<void> {
  const available = await adapter.checkAvailable();
  if (!available) {
    throw new Error(`execute: engine "${adapter.name}" is not available or not configured`);
  }

  await assertCommandExists('bd', 'Install with: npm install -g @beads/bd');
  const writer = new BeadsWriter(ctx.projectRoot);
  if (!(await writer.isAvailable())) {
    throw new Error('execute: Beads CLI (bd) not available');
  }

  const { stdout } = await runCommand('bd', ['ready'], ctx.projectRoot);
  const ids = parseBeadsReady(stdout);
  if (ids.length === 0) {
    logInfo('execute: no ready tasks');
    return;
  }

  for (const id of ids) {
    const result = await adapter.execute({ id, title: id }, { cwd: ctx.projectRoot });
    if (result.status === 'success') {
      await writer.close(id);
    } else if (result.status === 'failed') {
      await writer.update(id, result.error ?? 'task failed');
    } else {
      await writer.update(id, result.output ?? 'task skipped');
      logInfo(`execute: task ${id} skipped`);
    }
  }
}

function parseBeadsReady(output: string): string[] {
  const matches = output.match(/bd-[a-zA-Z0-9-]+/g);
  return matches ? Array.from(new Set(matches)) : [];
}
