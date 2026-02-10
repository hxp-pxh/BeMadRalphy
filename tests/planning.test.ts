import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import type { PipelineContext } from '../src/phases/types.js';
import { runPlanning } from '../src/planning/index.js';
import { resetCommandRunners, setCommandRunners } from '../src/utils/exec.js';

describe('runPlanning', () => {
  afterEach(() => {
    resetCommandRunners();
  });

  it('runs BMAD and validates required outputs', async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'bemadralphy-'));

    setCommandRunners({
      commandExists: async (command) => command === 'bmad',
      runCommand: async (command, args = [], cwd) => {
        if (command === 'bmad') {
          const directoryIndex = args.indexOf('--directory');
          const outputIndex = args.indexOf('--output-folder');
          const directory = directoryIndex >= 0 ? args[directoryIndex + 1] : cwd ?? tmpDir;
          const outputFolder = outputIndex >= 0 ? args[outputIndex + 1] : '_bmad-output';
          const outputDir = path.join(directory, outputFolder);
          await mkdir(path.join(outputDir, 'stories'), { recursive: true });
          await Promise.all([
            writeFile(path.join(outputDir, 'product-brief.md'), '# Product Brief\n', 'utf-8'),
            writeFile(path.join(outputDir, 'prd.md'), '# PRD\n', 'utf-8'),
            writeFile(path.join(outputDir, 'architecture.md'), '# Architecture\n', 'utf-8'),
            writeFile(path.join(outputDir, 'stories', 'epics.md'), '# Epics\n\n### Story\n', 'utf-8'),
          ]);
        }
        return { stdout: '', stderr: '' };
      },
    });

    const ctx: PipelineContext = {
      runId: 'test',
      mode: 'auto',
      dryRun: false,
      projectRoot: tmpDir,
    };

    await runPlanning(ctx);

    const productBrief = await readFile(
      path.join(tmpDir, '_bmad-output', 'product-brief.md'),
      'utf-8',
    );
    expect(productBrief).toContain('# Product Brief');
  });

  it('fails fast when bmad is missing', async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'bemadralphy-'));
    setCommandRunners({
      commandExists: async () => false,
    });

    const ctx: PipelineContext = {
      runId: 'test',
      mode: 'auto',
      dryRun: false,
      projectRoot: tmpDir,
    };

    await expect(runPlanning(ctx)).rejects.toThrow('Missing required CLI "bmad"');
  });
});
