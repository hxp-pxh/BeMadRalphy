import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parse, stringify } from 'yaml';

export type PipelineState = {
  phase: string;
  lastCompletedPhase?: string;
  failedPhase?: string;
  status?: 'running' | 'failed' | 'completed';
  resumeFromPhase?: string;
  lastError?: string;
  mode: 'auto' | 'hybrid' | 'supervised';
  engine?: string;
  executionProfile?: 'safe' | 'balanced' | 'fast';
  audienceProfile?: 'solo-dev' | 'agency-team' | 'product-team' | 'enterprise-team';
  lastGate?: string;
  tasksCompleted?: number;
  tasksTotal?: number;
  costUsd?: number;
  startedAt?: string;
  updatedAt?: string;
  finishedAt?: string;
  runId?: string;
  checkpoints?: Array<{ phase: string; timestamp: string }>;
  artifactPaths?: {
    brief?: string;
    prd?: string;
    architecture?: string;
    stories?: string;
  };
};

export async function loadState(projectRoot: string): Promise<PipelineState | null> {
  const statePath = path.join(projectRoot, '.bemadralphy', 'state.yaml');
  try {
    const raw = await readFile(statePath, 'utf-8');
    return (parse(raw) as PipelineState) ?? null;
  } catch {
    return null;
  }
}

export async function saveState(projectRoot: string, state: PipelineState): Promise<void> {
  const dir = path.join(projectRoot, '.bemadralphy');
  await mkdir(dir, { recursive: true });
  const statePath = path.join(dir, 'state.yaml');
  await writeFile(statePath, stringify(state), 'utf-8');
}
