import { createCliAdapter } from './cli-adapter.js';

export const opencodeAdapter = createCliAdapter({
  name: 'opencode',
  commandName: 'ralphy',
  hasNativeSwarm: false,
  buildArgs: (_task, prompt) => ['--opencode', '--max-iterations', '1', prompt],
  unavailableHint: 'Install ralphy and ensure it is on PATH.',
  failureHint: 'Ensure OpenCode integration is configured in ralphy.',
});
