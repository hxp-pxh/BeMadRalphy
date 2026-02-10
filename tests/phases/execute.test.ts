import { afterEach, describe, expect, it } from 'vitest';
import { engineAdapters } from '../../src/engines/index.js';
import { executePhase } from '../../src/phases/execute.js';
import type { PipelineContext } from '../../src/phases/types.js';
import { resetCommandRunners, setCommandRunners } from '../../src/utils/exec.js';

describe('executePhase', () => {
  afterEach(() => {
    resetCommandRunners();
    delete engineAdapters['test-engine'];
  });

  it('closes successful tasks and updates failed tasks', async () => {
    const commands: Array<{ command: string; args: string[] }> = [];
    setCommandRunners({
      commandExists: async (command) => command === 'bd',
      runCommand: async (command, args = []) => {
        commands.push({ command, args });
        if (command === 'bd' && args[0] === 'ready') {
          return { stdout: 'bd-1\nbd-2\n', stderr: '' };
        }
        return { stdout: '', stderr: '' };
      },
    });

    engineAdapters['test-engine'] = {
      name: 'test-engine',
      hasNativeSwarm: false,
      permissionFlags: [],
      checkAvailable: async () => true,
      execute: async (task) =>
        task.id === 'bd-1'
          ? { status: 'success', output: 'ok' }
          : { status: 'failed', error: 'bad task' },
    };

    const ctx: PipelineContext = {
      runId: 'test',
      mode: 'auto',
      dryRun: false,
      projectRoot: '/tmp/project',
      engine: 'test-engine',
    };

    await executePhase(ctx);

    expect(commands.map((call) => call.args.join(' '))).toContain('close bd-1');
    expect(commands.map((call) => call.args.join(' '))).toContain('update bd-2 --body bad task');
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
