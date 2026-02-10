import { access, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { runPipeline } from '../../src/orchestrator.js';
import { createFakeCliBin } from '../helpers/fake-cli.js';

describe.sequential('pipeline with fake external CLIs', () => {
  const originalPath = process.env.PATH ?? '';
  const originalLogPath = process.env.FAKE_CLI_LOG;

  afterEach(() => {
    process.env.PATH = originalPath;
    if (originalLogPath === undefined) {
      delete process.env.FAKE_CLI_LOG;
    } else {
      process.env.FAKE_CLI_LOG = originalLogPath;
    }
  });

  it('runs planning/sync/execute/post end-to-end with internal engines', async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'bemadralphy-e2e-'));
    const fakeLogPath = path.join(tmpDir, 'fake-cli.log');
    process.env.FAKE_CLI_LOG = fakeLogPath;

    const fakeBin = await createFakeCliBin(tmpDir, {
      claude: ['echo "claude $*" >> "$FAKE_CLI_LOG"', 'printf "claude-ok\\n"'].join('\n'),
      ralphy: [
        'echo "ralphy $*" >> "$FAKE_CLI_LOG"',
        'printf "ralphy-ok\\n"',
      ].join('\n'),
      git: [
        'echo "git $*" >> "$FAKE_CLI_LOG"',
        'if [ "${1:-}" = "status" ]; then',
        '  printf " M src/file.ts\\n"',
        'fi',
      ].join('\n'),
      gh: [
        'echo "gh $*" >> "$FAKE_CLI_LOG"',
        'if [ "${1:-}" = "auth" ] && [ "${2:-}" = "status" ]; then',
        '  printf "Logged in\\n"',
        'fi',
      ].join('\n'),
    });

    process.env.PATH = `${fakeBin}:${originalPath}`;

    await writeFile(path.join(tmpDir, 'idea.md'), '# Idea\n\nE2E validation project\n', 'utf-8');

    await runPipeline({
      mode: 'auto',
      maxParallel: 1,
      executionProfile: 'safe',
      audienceProfile: 'agency-team',
      brownfield: false,
      createPr: true,
      dryRun: false,
      engine: 'claude',
      projectRoot: tmpDir,
    });

    await access(path.join(tmpDir, 'tasks.md'));
    await access(path.join(tmpDir, '.bemadralphy', 'state.yaml'));
    await access(path.join(tmpDir, '.bemadralphy', 'cost.log'));

    const tasks = await readFile(path.join(tmpDir, 'tasks.md'), 'utf-8');
    expect(tasks).toContain('Story');

    const stateYaml = await readFile(path.join(tmpDir, '.bemadralphy', 'state.yaml'), 'utf-8');
    expect(stateYaml).toContain('phase: post');
    expect(stateYaml).toContain('executionProfile: safe');
    expect(stateYaml).toContain('audienceProfile: agency-team');

    const cliLog = await readFile(fakeLogPath, 'utf-8');
    expect(cliLog).toContain('claude');
    expect(cliLog).toContain('git status --short');
    expect(cliLog).toContain('gh auth status');
  });
});
