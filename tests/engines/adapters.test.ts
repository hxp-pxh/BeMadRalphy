import { afterEach, describe, expect, it } from 'vitest';
import { engineAdapters } from '../../src/engines/index.js';
import { resetCommandRunners, setCommandRunners } from '../../src/utils/exec.js';

describe('engine adapters', () => {
  afterEach(() => {
    resetCommandRunners();
  });

  it('uses explicit command contracts per engine', async () => {
    const calls: Array<{ command: string; args: string[] }> = [];
    const existenceChecks: string[] = [];

    setCommandRunners({
      commandExists: async (command) => {
        existenceChecks.push(command);
        return ['ralphy', 'gemini', 'kimi', 'ollama'].includes(command);
      },
      runCommand: async (command, args = []) => {
        calls.push({ command, args });
        return { stdout: 'ok\n', stderr: '' };
      },
    });

    const task = { id: 'bd-1', title: 'Task 1' };

    await expect(engineAdapters.claude.checkAvailable()).resolves.toBe(true);
    await expect(engineAdapters.codex.checkAvailable()).resolves.toBe(true);
    await expect(engineAdapters.cursor.checkAvailable()).resolves.toBe(true);
    await expect(engineAdapters.copilot.checkAvailable()).resolves.toBe(true);
    await expect(engineAdapters.opencode.checkAvailable()).resolves.toBe(true);
    await expect(engineAdapters.qwen.checkAvailable()).resolves.toBe(true);
    await expect(engineAdapters.gemini.checkAvailable()).resolves.toBe(true);
    await expect(engineAdapters.kimi.checkAvailable()).resolves.toBe(true);
    await expect(engineAdapters.ollama.checkAvailable()).resolves.toBe(true);

    await engineAdapters.claude.execute(task, { cwd: '/tmp/project' });
    await engineAdapters.codex.execute(task, { cwd: '/tmp/project' });
    await engineAdapters.cursor.execute(task, { cwd: '/tmp/project' });
    await engineAdapters.copilot.execute(task, { cwd: '/tmp/project' });
    await engineAdapters.opencode.execute(task, { cwd: '/tmp/project' });
    await engineAdapters.qwen.execute(task, { cwd: '/tmp/project' });
    await engineAdapters.gemini.execute(task, { cwd: '/tmp/project' });
    await engineAdapters.kimi.execute(task, { cwd: '/tmp/project' });
    await engineAdapters.ollama.execute(task, { cwd: '/tmp/project' });

    expect(existenceChecks).toContain('ralphy');
    expect(existenceChecks).toContain('gemini');
    expect(existenceChecks).toContain('kimi');
    expect(existenceChecks).toContain('ollama');

    expect(calls.some((call) => call.command === 'ralphy' && call.args.includes('--claude'))).toBe(true);
    expect(calls.some((call) => call.command === 'ralphy' && call.args.includes('--codex'))).toBe(true);
    expect(calls.some((call) => call.command === 'ralphy' && call.args.includes('--cursor'))).toBe(true);
    expect(calls.some((call) => call.command === 'ralphy' && call.args.includes('--copilot'))).toBe(true);
    expect(calls.some((call) => call.command === 'ralphy' && call.args.includes('--opencode'))).toBe(true);
    expect(calls.some((call) => call.command === 'ralphy' && call.args.includes('--qwen'))).toBe(true);
    expect(calls.some((call) => call.command === 'gemini')).toBe(true);
    expect(calls.some((call) => call.command === 'kimi')).toBe(true);
    expect(calls.some((call) => call.command === 'ollama' && call.args[0] === 'run')).toBe(true);
  });

  it('returns clear failure message when command execution fails', async () => {
    setCommandRunners({
      commandExists: async () => true,
      runCommand: async () => {
        throw new Error('auth required');
      },
    });

    const result = await engineAdapters.claude.execute({ id: 'bd-9', title: 'Task 9' }, {});
    expect(result.status).toBe('failed');
    expect(result.error).toContain('engine "claude" failed');
    expect(result.error).toContain('Ensure Claude access is configured');
  });
});
