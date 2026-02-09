import { describe, expect, it } from 'vitest';
import { mkdtemp, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { runPlanning } from '../src/planning/index.js';
import type { PipelineContext } from '../src/phases/types.js';

describe('runPlanning', () => {
  it('creates placeholder BMAD outputs', async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'bemadralphy-'));
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
});
