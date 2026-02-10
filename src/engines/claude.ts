import { createCliAdapter } from './cli-adapter.js';

export const claudeAdapter = createCliAdapter({
  name: 'claude',
  commandName: 'ralphy',
  hasNativeSwarm: true,
  permissionFlags: ['--dangerously-skip-permissions'],
  buildArgs: (_task, prompt) => ['--claude', '--max-iterations', '1', prompt],
  unavailableHint: 'Install ralphy and ensure it is on PATH.',
  failureHint: 'Ensure Claude access is configured in ralphy.',
});
