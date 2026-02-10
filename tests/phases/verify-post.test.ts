import { afterEach, describe, expect, it } from 'vitest';
import { postPhase } from '../../src/phases/post.js';
import { verifyPhase } from '../../src/phases/verify.js';
import type { PipelineContext } from '../../src/phases/types.js';
import { resetCommandRunners, setCommandRunners } from '../../src/utils/exec.js';

function baseCtx(): PipelineContext {
  return {
    runId: 'test',
    mode: 'auto',
    dryRun: false,
    projectRoot: '/tmp/project',
    engine: 'claude',
  };
}

describe('verify/post fail-fast behavior', () => {
  afterEach(() => {
    resetCommandRunners();
  });

  it('verify succeeds with internal spec validator', async () => {
    await expect(verifyPhase(baseCtx())).resolves.toEqual(baseCtx());
  });

  it('post fails when gh is missing while createPr is enabled', async () => {
    setCommandRunners({
      commandExists: async (command) => command !== 'gh',
      runCommand: async () => ({ stdout: '', stderr: '' }),
    });

    await expect(postPhase({ ...baseCtx(), createPr: true })).rejects.toThrow(
      '--create-pr requires both git and gh',
    );
  });
});
