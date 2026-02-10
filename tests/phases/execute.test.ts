import { mkdtemp } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { engineAdapters } from '../../src/engines/index.js';
import { executePhase } from '../../src/phases/execute.js';
import type { PipelineContext } from '../../src/phases/types.js';
import { TaskManager } from '../../src/tasks/index.js';
import { resetCommandRunners, setCommandRunners } from '../../src/utils/exec.js';

describe('executePhase', () => {
  afterEach(() => {
    resetCommandRunners();
    delete engineAdapters['test-engine'];
  });

  it('closes successful tasks and updates failed tasks', async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'bemadralphy-exec-'));
    const manager = await TaskManager.create(tmpDir);
    const first = manager.create({ storyId: 's1', title: 'Task A', description: 'A', status: 'open' });
    const second = manager.create({ storyId: 's2', title: 'Task B', description: 'B', status: 'open' });

    engineAdapters['test-engine'] = {
      name: 'test-engine',
      hasNativeSwarm: false,
      permissionFlags: [],
      checkAvailable: async () => true,
      execute: async (task) =>
        task.id === first.id
          ? { status: 'success', output: 'ok' }
          : { status: 'failed', error: 'bad task' },
    };

    const ctx: PipelineContext = {
      runId: 'test',
      mode: 'auto',
      dryRun: false,
      projectRoot: tmpDir,
      engine: 'test-engine',
    };

    await executePhase(ctx);

    expect(manager.get(first.id)?.status).toBe('done');
    expect(manager.get(second.id)?.status).toBe('failed');
  });

  it('runs the execute loop over ready tasks', async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'bemadralphy-exec-'));
    const manager = await TaskManager.create(tmpDir);
    const task = manager.create({ storyId: 's1', title: 'Task A', description: 'A', status: 'open' });

    engineAdapters['test-engine'] = {
      name: 'test-engine',
      hasNativeSwarm: false,
      permissionFlags: [],
      checkAvailable: async () => true,
      execute: async () => ({ status: 'success', output: 'ok' }),
    };

    const ctx: PipelineContext = {
      runId: 'test',
      mode: 'auto',
      dryRun: false,
      projectRoot: tmpDir,
      engine: 'test-engine',
    };

    await executePhase(ctx);

    expect(manager.get(task.id)?.status).toBe('done');
  });

  it('fails fast for unknown engine', async () => {
    const ctx: PipelineContext = {
      runId: 'test',
      mode: 'auto',
      dryRun: false,
      projectRoot: '/tmp/project',
      engine: 'unknown-engine',
    };

    await expect(executePhase(ctx)).rejects.toThrow('unknown engine');
  });

  it('fails fast when selected engine is unavailable', async () => {
    setCommandRunners({
      commandExists: async () => false,
    });

    engineAdapters['test-engine'] = {
      name: 'test-engine',
      hasNativeSwarm: false,
      permissionFlags: [],
      checkAvailable: async () => false,
      execute: async () => ({ status: 'success', output: 'ok' }),
    };

    const ctx: PipelineContext = {
      runId: 'test',
      mode: 'auto',
      dryRun: false,
      projectRoot: '/tmp/project',
      engine: 'test-engine',
    };

    await expect(executePhase(ctx)).rejects.toThrow('not available or not configured');
  });
});
