import { createCliAdapter } from './cli-adapter.js';

export const kimiAdapter = createCliAdapter({
  name: 'kimi',
  commandName: 'kimi',
  hasNativeSwarm: true,
  buildArgs: (_task, prompt) => [prompt],
  unavailableHint: 'Install Kimi CLI and ensure it is on PATH.',
  failureHint: 'Ensure Kimi CLI is authenticated.',
});
