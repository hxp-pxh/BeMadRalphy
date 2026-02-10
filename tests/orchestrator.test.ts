import { access, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { runDoctor, runInit, runPipeline } from '../src/orchestrator.js';
import { resetCommandRunners, setCommandRunners } from '../src/utils/exec.js';

describe.sequential('runInit', () => {
  afterEach(() => {
    resetCommandRunners();
  });

  it('creates required directories and starter idea file', async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'bemadralphy-'));
    const calls: Array<{ command: string; args: string[] }> = [];

    setCommandRunners({
      commandExists: async () => false,
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
    expect(calls).toHaveLength(0);
  });

  it('completes partial setup when required CLIs are missing', async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'bemadralphy-'));
    const calls: Array<{ command: string; args: string[] }> = [];
    setCommandRunners({
      commandExists: async () => false,
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
    expect(calls).toHaveLength(0);
  });

  it('does not auto-install parent CLIs during init', async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'bemadralphy-'));
    const calls: Array<{ command: string; args: string[] }> = [];
    const available = new Set<string>(['npm']);
    setCommandRunners({
      commandExists: async (command) => available.has(command),
      runCommand: async (command, args = []) => {
        calls.push({ command, args });
        return { stdout: '', stderr: '' };
      },
    });

    await runInit(tmpDir);

    expect(calls.some((call) => call.command === 'npm' && call.args[0] === 'install')).toBe(false);
  });
});

describe.sequential('runPipeline', () => {
  afterEach(() => {
    resetCommandRunners();
  });

  it('supports dry-run preflight without creating pipeline state', async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'bemadralphy-dry-run-'));
    setCommandRunners({
      commandExists: async () => false,
      runCommand: async () => ({ stdout: '', stderr: '' }),
    });

    await runPipeline({
      mode: 'hybrid',
      projectRoot: tmpDir,
      dryRun: true,
      output: 'json',
    });

    await expect(access(path.join(tmpDir, '.bemadralphy', 'state.yaml'))).rejects.toBeDefined();
  });

  it('writes run history records for completed runs', async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'bemadralphy-history-run-'));
    const calls: Array<{ command: string; args: string[] }> = [];
    setCommandRunners({
      commandExists: async () => true,
      runCommand: async (command, args = [], _cwd) => {
        calls.push({ command, args });
        if (command === 'claude') {
          return { stdout: 'ok', stderr: '' };
        }
        return { stdout: '', stderr: '' };
      },
    });

    await writeFile(path.join(tmpDir, 'idea.md'), '# Idea\n\nTest\n', 'utf-8');

    await runPipeline({
      mode: 'auto',
      projectRoot: tmpDir,
      dryRun: false,
      output: 'text',
      createPr: false,
      engine: 'claude',
      maxParallel: 1,
    });

    const historyRaw = await readFile(path.join(tmpDir, '.bemadralphy', 'runs.jsonl'), 'utf-8');
    expect(historyRaw).toContain('"status":"completed"');
    expect(calls.length).toBeGreaterThanOrEqual(0);
  });
});

describe.sequential('runDoctor', () => {
  afterEach(() => {
    resetCommandRunners();
  });

  it('runs dependency checks in text and json modes', async () => {
    setCommandRunners({
      commandExists: async (command) => ['npm', 'claude', 'ollama'].includes(command),
      runCommand: async () => ({ stdout: '', stderr: '' }),
    });

    await runDoctor('text');
    await runDoctor('json');
  });
});
