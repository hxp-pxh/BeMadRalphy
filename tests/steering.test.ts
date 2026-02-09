import { describe, expect, it } from 'vitest';
import { mkdtemp } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { access } from 'node:fs/promises';
import { steeringPhase } from '../src/phases/steering.js';
import type { PipelineContext } from '../src/phases/types.js';

describe('steeringPhase', () => {
  it('writes core steering files', async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'bemadralphy-'));
    const ctx: PipelineContext = {
      runId: 'test',
      mode: 'auto',
      dryRun: false,
      projectRoot: tmpDir,
    };

    await steeringPhase(ctx);

    await access(path.join(tmpDir, 'AGENTS.md'));
    await access(path.join(tmpDir, 'CLAUDE.md'));
    await access(path.join(tmpDir, '.cursorrules'));
    await access(path.join(tmpDir, '.github', 'copilot-instructions.md'));
  });
});
