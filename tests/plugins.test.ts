import { mkdtemp, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { engineAdapters } from '../src/engines/index.js';
import { loadPlugins, runPhaseHooks } from '../src/plugins/index.js';
import type { PipelineContext } from '../src/phases/types.js';

describe('plugin runtime', () => {
  afterEach(() => {
    delete engineAdapters['plugin-engine'];
  });

  it('registers engines and phase hooks from plugin modules', async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'bemadralphy-plugin-'));
    await writeFile(
      path.join(tmpDir, 'test-plugin.mjs'),
      [
        'export default {',
        "  name: 'test-plugin',",
        '  register(api) {',
        "    api.registerEngine('plugin-engine', {",
        "      name: 'plugin-engine',",
        '      hasNativeSwarm: false,',
        '      permissionFlags: [],',
        '      async checkAvailable() { return true; },',
        "      async execute() { return { status: 'success', output: 'ok' }; }",
        '    });',
        "    api.onBeforePhase('intake', (ctx) => { ctx.intakePath = '/tmp/plugin'; });",
        '  }',
        '};',
      ].join('\n'),
      'utf-8',
    );

    const runtime = await loadPlugins(tmpDir, ['./test-plugin.mjs']);
    expect(engineAdapters['plugin-engine']).toBeDefined();

    const ctx: PipelineContext = {
      runId: 'run-test',
      mode: 'hybrid',
      dryRun: false,
      projectRoot: tmpDir,
    };

    await runPhaseHooks(runtime.beforeHooks, 'intake', ctx);
    expect(ctx.intakePath).toBe('/tmp/plugin');
  });
});
