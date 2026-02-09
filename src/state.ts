import { logInfo } from './utils/logging.js';

export type PipelineState = {
  phase: string;
  mode: 'auto' | 'hybrid' | 'supervised';
  engine?: string;
  lastGate?: string;
  tasksCompleted?: number;
  tasksTotal?: number;
  costUsd?: number;
  startedAt?: string;
};

export async function loadState(): Promise<PipelineState | null> {
  logInfo('state load not implemented yet');
  return null;
}

export async function saveState(_state: PipelineState): Promise<void> {
  logInfo('state save not implemented yet');
}
