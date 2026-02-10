import { createCliAdapter } from './cli-adapter.js';

export const qwenAdapter = createCliAdapter({
  name: 'qwen',
  commandName: 'ralphy',
  hasNativeSwarm: false,
  buildArgs: (_task, prompt) => ['--qwen', '--max-iterations', '1', prompt],
  unavailableHint: 'Install ralphy and ensure it is on PATH.',
  failureHint: 'Ensure Qwen integration is configured in ralphy.',
});
