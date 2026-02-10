import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export type RunHistoryRecord = {
  runId: string;
  startedAt: string;
  finishedAt?: string;
  status: 'running' | 'failed' | 'completed';
  mode: 'auto' | 'hybrid' | 'supervised';
  engine?: string;
  output?: 'text' | 'json';
  phase?: string;
  resumeFromPhase?: string;
  options: Record<string, unknown>;
  error?: string;
};

const RUNS_PATH = ['.bemadralphy', 'runs.jsonl'];

export async function appendRunHistory(
  projectRoot: string,
  record: RunHistoryRecord,
): Promise<void> {
  const fullPath = path.join(projectRoot, ...RUNS_PATH);
  await mkdir(path.dirname(fullPath), { recursive: true });
  const existing = await safeRead(fullPath);
  await writeFile(fullPath, `${existing}${JSON.stringify(record)}\n`, 'utf-8');
}

export async function readRunHistory(projectRoot: string): Promise<RunHistoryRecord[]> {
  const fullPath = path.join(projectRoot, ...RUNS_PATH);
  const raw = await safeRead(fullPath);
  if (!raw.trim()) {
    return [];
  }
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as RunHistoryRecord);
}

export async function findRunHistory(
  projectRoot: string,
  runId: string,
): Promise<RunHistoryRecord | null> {
  const rows = await readRunHistory(projectRoot);
  const found = rows.find((row) => row.runId === runId);
  return found ?? null;
}

async function safeRead(filePath: string): Promise<string> {
  try {
    return await readFile(filePath, 'utf-8');
  } catch {
    return '';
  }
}
