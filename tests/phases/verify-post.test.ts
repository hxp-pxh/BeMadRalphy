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
    engine: 'ralphy',
  };
}

describe('verify/post fail-fast behavior', () => {
  afterEach(() => {
    resetCommandRunners();
  });

  it('verify fails when openspec is missing', async () => {
    setCommandRunners({
      commandExists: async () => false,
    });
    await expect(verifyPhase(baseCtx())).rejects.toThrow('Missing required CLI "openspec"');
  });

  it('post fails when gh is missing while createPr is enabled', async () => {
    setCommandRunners({
      commandExists: async (command) => command !== 'gh' && command === 'openspec',
      runCommand: async () => ({ stdout: '', stderr: '' }),
    });

    await expect(postPhase({ ...baseCtx(), createPr: true })).rejects.toThrow(
      '--create-pr requires both git and gh',
    );
  });
});
