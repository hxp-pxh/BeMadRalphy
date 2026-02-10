import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { validateBmadOutputs } from '../../src/planning/validate.js';

describe('validateBmadOutputs', () => {
  it('passes when all files exist and are non-empty', async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'bemadralphy-'));
    const storiesDir = path.join(tmpDir, 'stories');
    await mkdir(storiesDir, { recursive: true });

    const outputs = {
      productBriefPath: path.join(tmpDir, 'product-brief.md'),
      prdPath: path.join(tmpDir, 'prd.md'),
      architecturePath: path.join(tmpDir, 'architecture.md'),
      storiesPath: path.join(storiesDir, 'epics.md'),
    };

    await Promise.all([
      writeFile(outputs.productBriefPath, '# Product Brief\n', 'utf-8'),
      writeFile(outputs.prdPath, '# PRD\n', 'utf-8'),
      writeFile(outputs.architecturePath, '# Architecture\n', 'utf-8'),
      writeFile(outputs.storiesPath, '# Epics\n', 'utf-8'),
    ]);

    await expect(validateBmadOutputs(outputs)).resolves.toBeUndefined();
  });

  it('throws when a required output is missing', async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'bemadralphy-'));
    const outputs = {
      productBriefPath: path.join(tmpDir, 'product-brief.md'),
      prdPath: path.join(tmpDir, 'prd.md'),
      architecturePath: path.join(tmpDir, 'architecture.md'),
      storiesPath: path.join(tmpDir, 'stories', 'epics.md'),
    };

    await expect(validateBmadOutputs(outputs)).rejects.toThrow('Missing product brief output');
  });
});
