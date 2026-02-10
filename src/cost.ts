import { appendFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { runCommand } from './utils/exec.js';

export class CostTracker {
  private totalUsd = 0;

  addCost(amountUsd: number): void {
    this.totalUsd += amountUsd;
  }

  getTotal(): number {
    return this.totalUsd;
  }

  async persist(projectRoot: string): Promise<void> {
    const dir = path.join(projectRoot, '.bemadralphy');
    await mkdir(dir, { recursive: true });
    const costPath = path.join(dir, 'cost.log');
    const row = JSON.stringify({
      ts: new Date().toISOString(),
      totalUsd: Number(this.totalUsd.toFixed(4)),
    });
    await appendFile(costPath, `${row}\n`, 'utf-8');
  }
}

export type CostEstimate = {
  estimatedUsd: number;
  minUsd: number;
  maxUsd: number;
  taskCount: number;
  heuristic: string;
};

export async function estimateRunCost(projectRoot: string, maxParallel: number): Promise<CostEstimate> {
  const taskCount = await estimateReadyTasks(projectRoot);
  const baseCost = 0.08;
  const perTask = 0.07;
  const concurrencyMultiplier = Math.max(1, Math.min(maxParallel || 1, 8)) * 0.01;
  const estimatedUsd = baseCost + taskCount * (perTask + concurrencyMultiplier);
  return {
    estimatedUsd: round4(estimatedUsd),
    minUsd: round4(estimatedUsd * 0.65),
    maxUsd: round4(estimatedUsd * 1.45),
    taskCount,
    heuristic:
      'Heuristic estimate based on ready Beads tasks and configured parallelism; actual token usage varies by model and task size.',
  };
}

async function estimateReadyTasks(projectRoot: string): Promise<number> {
  try {
    const { stdout } = await runCommand('bd', ['ready'], projectRoot);
    const ids = stdout.match(/bd-[a-zA-Z0-9-]+/g);
    if (!ids) {
      return 0;
    }
    return new Set(ids).size;
  } catch {
    return 0;
  }
}

function round4(value: number): number {
  return Number(value.toFixed(4));
}
