import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { intakePhase } from '../src/phases/intake.js';
import type { PipelineContext } from '../src/phases/types.js';

describe('intakePhase', () => {
  it('writes .bemadralphy/intake.yaml from idea.md', async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'bemadralphy-'));
    const ideaPath = path.join(tmpDir, 'idea.md');
    await writeFile(
      ideaPath,
      `---\nproject_type: full-stack\nruntime: node\n---\n\nTest project\n`,
      'utf-8',
    );

    const ctx: PipelineContext = {
      runId: 'test',
      mode: 'auto',
      dryRun: false,
      projectRoot: tmpDir,
    };

    const updated = await intakePhase(ctx);
    expect(updated.intakePath).toBeTruthy();

    const intakeYaml = await readFile(path.join(tmpDir, '.bemadralphy', 'intake.yaml'), 'utf-8');
    const parsed = parse(intakeYaml) as Record<string, unknown>;
    expect(parsed.source_file).toBe('idea.md');
    expect(parsed.decisions).toMatchObject({ project_type: 'full-stack', runtime: 'node' });
  });

  it('throws when idea.md or plan.md is missing', async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'bemadralphy-'));
    const ctx: PipelineContext = {
      runId: 'test',
      mode: 'auto',
      dryRun: false,
      projectRoot: tmpDir,
    };

    await expect(intakePhase(ctx)).rejects.toThrow('No idea.md or plan.md found');
  });
});
