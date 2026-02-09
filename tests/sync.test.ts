import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { syncPhase } from '../src/phases/sync.js';
import type { PipelineContext } from '../src/phases/types.js';

describe('syncPhase', () => {
  it('writes tasks.md from stories', async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'bemadralphy-'));
    const storiesDir = path.join(tmpDir, '_bmad-output', 'stories');
    await mkdir(storiesDir, { recursive: true });
    await writeFile(
      path.join(storiesDir, 'epics.md'),
      `# Epics\n\n### Task A\n\nDetails\n`,
      'utf-8',
    );

    const ctx: PipelineContext = {
      runId: 'test',
      mode: 'auto',
      dryRun: false,
      projectRoot: tmpDir,
    };

    await syncPhase(ctx);

    const tasksMd = await readFile(path.join(tmpDir, 'tasks.md'), 'utf-8');
    expect(tasksMd).toContain('Task A');
  });
});
