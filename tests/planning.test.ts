import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import type { PipelineContext } from '../src/phases/types.js';
import { runPlanning } from '../src/planning/index.js';

describe('runPlanning', () => {
  it('generates fallback planning outputs when direct AI generation fails', async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'bemadralphy-'));
    await writeFile(path.join(tmpDir, 'idea.md'), '# Idea\n\nFallback path.\n', 'utf-8');

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
    expect(productBrief).toContain('Generated fallback');
    const prd = await readFile(path.join(tmpDir, '_bmad-output', 'prd.md'), 'utf-8');
    expect(prd).toContain('Generated fallback');
  });

  it('respects dry run', async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'bemadralphy-'));
    const ctx: PipelineContext = {
      runId: 'test',
      mode: 'auto',
      dryRun: true,
      projectRoot: tmpDir,
    };

    await runPlanning(ctx);
    await expect(readFile(path.join(tmpDir, '_bmad-output', 'product-brief.md'), 'utf-8')).rejects.toThrow();
  });
});
