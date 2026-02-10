import { access, mkdtemp } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, it } from 'vitest';
import { runInit } from '../src/orchestrator.js';
import { resetCommandRunners, setCommandRunners } from '../src/utils/exec.js';

describe.sequential('runInit', () => {
  afterEach(() => {
    resetCommandRunners();
  });

  it('creates required directories and starter idea file', async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'bemadralphy-'));

    setCommandRunners({
      commandExists: async () => false,
    });

    await runInit(tmpDir);

    await access(path.join(tmpDir, '.bemadralphy'));
    await access(path.join(tmpDir, 'openspec', 'specs'));
    await access(path.join(tmpDir, '_bmad-output', 'stories'));
    await access(path.join(tmpDir, 'idea.md'));
  });
});
