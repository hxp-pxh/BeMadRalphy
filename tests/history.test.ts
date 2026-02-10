import { mkdtemp } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { appendRunHistory, findRunHistory, readRunHistory } from '../src/history.js';

describe('run history', () => {
  it('appends and reads run history records', async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'bemadralphy-history-'));
    await appendRunHistory(tmpDir, {
      runId: 'run-1',
      startedAt: new Date().toISOString(),
      status: 'running',
      mode: 'hybrid',
      options: { mode: 'hybrid' },
    });
    await appendRunHistory(tmpDir, {
      runId: 'run-2',
      startedAt: new Date().toISOString(),
      status: 'completed',
      mode: 'auto',
      phase: 'post',
      options: { mode: 'auto' },
    });

    const rows = await readRunHistory(tmpDir);
    expect(rows).toHaveLength(2);
    expect(rows[0]?.runId).toBe('run-1');
    expect(rows[1]?.runId).toBe('run-2');
  });

  it('finds records by runId', async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'bemadralphy-history-'));
    await appendRunHistory(tmpDir, {
      runId: 'run-42',
      startedAt: new Date().toISOString(),
      status: 'failed',
      mode: 'supervised',
      options: { mode: 'supervised' },
    });

    const found = await findRunHistory(tmpDir, 'run-42');
    const missing = await findRunHistory(tmpDir, 'run-x');
    expect(found?.runId).toBe('run-42');
    expect(missing).toBeNull();
  });
});
