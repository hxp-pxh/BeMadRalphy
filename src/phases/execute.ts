import { engineAdapters } from '../engines/index.js';
import { runClaudeTeamsBatch } from '../swarm/claude-teams.js';
import { runCodexAgentsBatch } from '../swarm/codex-sdk.js';
import { resolveSwarmMode } from '../swarm/detector.js';
import { runKimiParlBatch } from '../swarm/kimi-parl.js';
import { BeadsWriter } from '../beads/writer.js';
import { runCommand } from '../utils/exec.js';
import { logInfo } from '../utils/logging.js';
import type { PipelineContext } from './types.js';

export async function executePhase(ctx: PipelineContext): Promise<PipelineContext> {
  logInfo('Phase 6 (execute): swarm-aware task execution');
  if (ctx.dryRun) {
    logInfo('execute: dry-run, skipping');
    return ctx;
  }

  const engineName = ctx.engine ?? 'claude';
  const adapter = engineAdapters[engineName];
  if (!adapter) {
    logInfo(`execute: unknown engine "${engineName}"`);
    return ctx;
  }

  const swarmMode = resolveSwarmMode(engineName, ctx.swarm);
  logInfo(`execute: engine=${engineName} swarm=${swarmMode}`);

  if (swarmMode === 'native') {
    if (engineName === 'claude') {
      await runClaudeTeamsBatch();
    } else if (engineName === 'kimi') {
      await runKimiParlBatch();
    } else if (engineName === 'codex') {
      await runCodexAgentsBatch();
    }
  } else if (swarmMode === 'process') {
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
    logInfo(`execute: engine "${adapter.name}" not available; skipping`);
    return;
  }

  const writer = new BeadsWriter(ctx.projectRoot);
  if (!(await writer.isAvailable())) {
    logInfo('execute: Beads CLI not available; skipping');
    return;
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
      logInfo(`execute: task ${id} skipped`);
    }
  }
}

function parseBeadsReady(output: string): string[] {
  const matches = output.match(/bd-[a-zA-Z0-9-]+/g);
  return matches ? Array.from(new Set(matches)) : [];
}
