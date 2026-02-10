import { access, mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
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

  it('attempts to auto-install missing required CLIs when npm is available', async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'bemadralphy-'));
    const calls: Array<{ command: string; args: string[] }> = [];
    const available = new Set<string>(['npm']);
    setCommandRunners({
      commandExists: async (command) => available.has(command),
      runCommand: async (command, args = []) => {
        calls.push({ command, args });
        if (command === 'npm' && args[0] === 'install' && args[1] === '-g') {
          const pkg = args[2];
          if (pkg === '@beads/bd' || pkg === '@beads/bd@latest') {
            available.add('bd');
          }
          if (pkg === 'bmad-method' || pkg === 'bmad-method@latest') {
            available.add('bmad');
          }
          if (pkg === '@fission-ai/openspec' || pkg === '@fission-ai/openspec@latest') {
            available.add('openspec');
          }
          if (pkg === 'ralphy-cli' || pkg === 'ralphy-cli@latest') {
            available.add('ralphy');
          }
        }
        if (command === 'npm' && args[0] === 'view') {
          return { stdout: '"1.0.0"\n', stderr: '' };
        }
        if (args[0] === '--version') {
          return { stdout: '1.0.0\n', stderr: '' };
        }
        return { stdout: '', stderr: '' };
      },
    });

    await runInit(tmpDir);

    expect(calls.some((call) => call.command === 'npm' && call.args[0] === 'install')).toBe(true);
    expect(calls.some((call) => call.command === 'npm' && call.args[2] === 'ralphy-cli')).toBe(true);
    expect(calls.some((call) => call.command === 'bd' && call.args[0] === 'init')).toBe(true);
    expect(calls.some((call) => call.command === 'openspec' && call.args[0] === 'init')).toBe(true);
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
      runCommand: async (command, args = [], cwd) => {
        calls.push({ command, args });
        if (command === 'bmad') {
          const outputDir = path.join(cwd ?? tmpDir, '_bmad-output', 'stories');
          await mkdir(outputDir, { recursive: true });
          await writeFile(path.join(cwd ?? tmpDir, '_bmad-output', 'product-brief.md'), '# brief\n', 'utf-8');
          await writeFile(path.join(cwd ?? tmpDir, '_bmad-output', 'prd.md'), '# prd\n', 'utf-8');
          await writeFile(path.join(cwd ?? tmpDir, '_bmad-output', 'architecture.md'), '# arch\n', 'utf-8');
          await writeFile(path.join(outputDir, 'epics.md'), '# Epics\n\n### Task A\n', 'utf-8');
        }
        if (command === 'bd' && args[0] === 'ready') {
          return { stdout: 'bd-1\n', stderr: '' };
        }
        if (command === 'bd' && args[0] === 'create') {
          return { stdout: 'bd-1\n', stderr: '' };
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
      engine: 'ralphy',
      maxParallel: 1,
    });

    const historyRaw = await readFile(path.join(tmpDir, '.bemadralphy', 'runs.jsonl'), 'utf-8');
    expect(historyRaw).toContain('"status":"completed"');
    expect(calls.some((call) => call.command === 'bd' && call.args[0] === 'ready')).toBe(true);
  });
});

describe.sequential('runDoctor', () => {
  afterEach(() => {
    resetCommandRunners();
  });

  it('runs dependency checks in text and json modes', async () => {
    setCommandRunners({
      commandExists: async (command) => ['npm', 'bd', 'bmad', 'openspec'].includes(command),
      runCommand: async () => ({ stdout: '', stderr: '' }),
    });

    await runDoctor('text');
    await runDoctor('json');
  });
});
