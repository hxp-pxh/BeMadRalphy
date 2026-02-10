import { createCliAdapter } from './cli-adapter.js';

export const codexAdapter = createCliAdapter({
  name: 'codex',
  commandName: 'ralphy',
  hasNativeSwarm: true,
  buildArgs: (_task, prompt) => ['--codex', '--max-iterations', '1', prompt],
  unavailableHint: 'Install ralphy and ensure it is on PATH.',
  failureHint: 'Ensure Codex access is configured in ralphy.',
});
