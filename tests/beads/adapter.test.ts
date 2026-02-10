import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { storiesToBeads } from '../../src/beads/adapter.js';

describe('storiesToBeads', () => {
  it('accumulates dependencies across multiple depends-on lines', async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'bemadralphy-'));
    const storiesDir = path.join(tmpDir, '_bmad-output', 'stories');
    const storyPath = path.join(storiesDir, 'epics.md');
    await mkdir(storiesDir, { recursive: true });
    await writeFile(
      storyPath,
      `# Epics

- depends on: id-a
- depends on: id-b, id-c

### Task A
`,
      'utf-8',
    );

    const parsed = await storiesToBeads([storyPath]);
    expect(parsed).toHaveLength(1);
    expect(parsed[0]?.dependencies).toEqual(['id-a', 'id-b', 'id-c']);
  });
});
