import { access, mkdtemp } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { runInit } from '../src/orchestrator.js';
import { resetCommandRunners, setCommandRunners } from '../src/utils/exec.js';

describe.sequential('runInit', () => {
  afterEach(() => {
    resetCommandRunners();
  });

  it('creates required directories and starter idea file', async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'bemadralphy-'));
    const calls: Array<{ command: string; args: string[] }> = [];

    setCommandRunners({
      commandExists: async (command) => ['bd', 'bmad', 'openspec'].includes(command),
      runCommand: async (command, args = []) => {
        calls.push({ command, args });
        return { stdout: '', stderr: '' };
      },
    });

    await runInit(tmpDir);

    await access(path.join(tmpDir, '.bemadralphy'));
    await access(path.join(tmpDir, 'openspec', 'specs'));
    await access(path.join(tmpDir, '_bmad-output', 'stories'));
    await access(path.join(tmpDir, 'idea.md'));
    expect(calls.some((call) => call.command === 'bd' && call.args[0] === 'init')).toBe(true);
    expect(calls.some((call) => call.command === 'openspec' && call.args[0] === 'init')).toBe(true);
  });
});
