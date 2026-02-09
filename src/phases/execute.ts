import { engineAdapters } from '../engines/index.js';
import { runClaudeTeamsBatch } from '../swarm/claude-teams.js';
import { runCodexAgentsBatch } from '../swarm/codex-sdk.js';
import { resolveSwarmMode } from '../swarm/detector.js';
import { runKimiParlBatch } from '../swarm/kimi-parl.js';
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
    logInfo(
      `execute: process-level parallelism not implemented (maxParallel=${ctx.maxParallel ?? 3})`,
    );
  } else {
    logInfo('execute: swarm off; single-agent execution not implemented');
  }
  return ctx;
}
