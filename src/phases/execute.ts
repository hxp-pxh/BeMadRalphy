import { engineAdapters } from '../engines/index.js';
import { runClaudeTeamsBatch } from '../swarm/claude-teams.js';
import { runCodexAgentsBatch } from '../swarm/codex-sdk.js';
import { resolveExecutionPolicy } from '../swarm/detector.js';
import { runKimiParlBatch } from '../swarm/kimi-parl.js';
import { createAIProvider } from '../ai/index.js';
import { TaskManager } from '../tasks/index.js';
import { withRetry } from '../execution/retry.js';
import { logInfo, logProgress } from '../utils/logging.js';
import type { PipelineContext } from './types.js';

export async function executePhase(ctx: PipelineContext): Promise<PipelineContext> {
  logInfo('Phase 6 (execute): swarm-aware task execution');
  logProgress('phase', 'start', 'execute phase started');
  if (ctx.dryRun) {
    logInfo('execute: dry-run, skipping');
    logProgress('phase', 'done', 'execute phase skipped due to dry run');
    return ctx;
  }

  const engineName = ctx.engine ?? 'claude';
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
      await runReadyTaskLoop(ctx, adapter);
    }
  } else if (policy.swarmMode === 'process') {
    await runReadyTaskLoop(ctx, adapter);
  } else {
    await runReadyTaskLoop(ctx, adapter);
  }
  logProgress('phase', 'done', 'execute phase completed');
  return ctx;
}

async function runReadyTaskLoop(
  ctx: PipelineContext,
  adapter: (typeof engineAdapters)[string],
): Promise<void> {
  const available = await adapter.checkAvailable();
  if (!available) {
    throw new Error(`execute: engine "${adapter.name}" is not available or not configured`);
  }

  const manager = await TaskManager.create(ctx.projectRoot);
  const reviewer = ctx.mode === 'auto' ? null : createAIProvider(ctx.model);
  const readyTasks = manager.getReady();
  if (readyTasks.length === 0) {
    logInfo('execute: no ready tasks');
    return;
  }

  let completedCount = 0;
  for (const task of readyTasks) {
    logProgress('task', 'start', `execute: task ${task.id} started`, { taskId: task.id });
    manager.update(task.id, { status: 'in_progress' });
    const result = await withRetry(
      () =>
        adapter.execute(
          { id: task.id, title: task.title, description: task.description },
          { cwd: ctx.projectRoot, dryRun: ctx.dryRun },
        ),
      {
        maxRetries: ctx.timeout ? Math.max(1, Math.min(5, Math.floor(ctx.timeout / 60))) : 3,
      },
    );
    if (result.status === 'success') {
      if (reviewer) {
        await runTwoStageReview(reviewer, task, result.output ?? '');
      }
      manager.update(task.id, { status: 'done', output: result.output });
      logProgress('task', 'done', `execute: task ${task.id} completed`, { taskId: task.id });
    } else if (result.status === 'failed') {
      manager.update(task.id, { status: 'failed', error: result.error ?? 'task failed' });
      logProgress('task', 'failed', `execute: task ${task.id} failed`, {
        taskId: task.id,
        error: result.error ?? 'task failed',
      });
    } else {
      manager.update(task.id, { status: 'open', output: result.output ?? 'task skipped' });
      logInfo(`execute: task ${task.id} skipped`);
      logProgress('task', 'progress', `execute: task ${task.id} skipped`, { taskId: task.id });
    }

    completedCount += 1;
    if (typeof ctx.budget === 'number') {
      const estimatedSpent = Number((completedCount * 0.07).toFixed(4));
      if (estimatedSpent > ctx.budget) {
        throw new Error(
          `execute: estimated budget exceeded (${estimatedSpent.toFixed(2)} > ${ctx.budget.toFixed(2)})`,
        );
      }
    }
  }
}

async function runTwoStageReview(
  reviewer: ReturnType<typeof createAIProvider>,
  task: { id: string; title: string; description: string },
  output: string,
): Promise<void> {
  const specPrompt = [
    'You are doing spec compliance review.',
    'The implementer may be optimistic. Verify independently.',
    `Task: ${task.id} - ${task.title}`,
    `Description: ${task.description}`,
    `Output:\n${output}`,
    'Return PASS or FAIL and a one-sentence reason.',
  ].join('\n\n');
  const specResult = await reviewer.complete(specPrompt);
  if (!specResult.toLowerCase().includes('pass')) {
    throw new Error(`execute: spec compliance review failed for ${task.id}: ${specResult}`);
  }

  const qualityPrompt = [
    'You are doing code quality review.',
    'Assess correctness, error handling, type safety, and test quality.',
    `Task: ${task.id} - ${task.title}`,
    `Output:\n${output}`,
    'Return PASS or FAIL and a one-sentence reason.',
  ].join('\n\n');
  const qualityResult = await reviewer.complete(qualityPrompt);
  if (!qualityResult.toLowerCase().includes('pass')) {
    throw new Error(`execute: quality review failed for ${task.id}: ${qualityResult}`);
  }
}
