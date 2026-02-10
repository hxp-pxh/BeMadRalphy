import { mkdtemp, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadRunConfig } from '../src/config.js';

describe('loadRunConfig', () => {
  it('reads .bemadralphyrc yaml config', async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'bemadralphy-config-'));
    await writeFile(
      path.join(tmpDir, '.bemadralphyrc'),
      ['mode: auto', 'engine: ollama', 'maxParallel: 4', 'output: json'].join('\n'),
      'utf-8',
    );

    const config = await loadRunConfig(tmpDir);
    expect(config.mode).toBe('auto');
    expect(config.engine).toBe('ollama');
    expect(config.maxParallel).toBe(4);
    expect(config.output).toBe('json');
  });

  it('reads bemad.config.js config', async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'bemadralphy-config-'));
    await writeFile(
      path.join(tmpDir, 'bemad.config.js'),
      'export default { mode: "supervised", createPr: true, plugins: ["./local-plugin.mjs"] };',
      'utf-8',
    );

    const config = await loadRunConfig(tmpDir);
    expect(config.mode).toBe('supervised');
    expect(config.createPr).toBe(true);
    expect(config.plugins).toEqual(['./local-plugin.mjs']);
  });
});
