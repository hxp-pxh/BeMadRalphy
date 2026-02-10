import { afterEach, describe, expect, it } from 'vitest';
import { BeadsWriter } from '../../src/beads/writer.js';
import { resetCommandRunners, setCommandRunners } from '../../src/utils/exec.js';

describe('BeadsWriter', () => {
  afterEach(() => {
    resetCommandRunners();
  });

  it('invokes bd commands when available', async () => {
    const calls: Array<{ command: string; args: string[] }> = [];
    setCommandRunners({
      commandExists: async (command) => command === 'bd',
      runCommand: async (command, args = []) => {
        calls.push({ command, args });
        if (args[0] === 'create') {
          return { stdout: 'bd-123\n', stderr: '' };
        }
        return { stdout: '', stderr: '' };
      },
    });

    const writer = new BeadsWriter('/tmp/project');
    await writer.init();
    const id = await writer.create('Task title', 'Task body');
    await writer.update(id, 'Updated');
    await writer.close(id);

    expect(id).toBe('bd-123');
    expect(calls.map((call) => call.args[0])).toEqual(['init', 'create', 'update', 'close']);
  });

  it('throws and skips commands when bd is unavailable', async () => {
    const calls: Array<{ command: string; args: string[] }> = [];
    setCommandRunners({
      commandExists: async () => false,
      runCommand: async (command, args = []) => {
        calls.push({ command, args });
        return { stdout: '', stderr: '' };
      },
    });

    const writer = new BeadsWriter('/tmp/project');
    await expect(writer.create('Task title', 'Task body')).rejects.toThrow(
      'BeadsWriter.create: bd not available',
    );

    expect(calls).toHaveLength(0);
  });
});
