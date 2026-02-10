import { createCliAdapter } from './cli-adapter.js';

export const cursorAdapter = createCliAdapter({
  name: 'cursor',
  commandName: 'ralphy',
  hasNativeSwarm: false,
  buildArgs: (_task, prompt) => ['--cursor', '--max-iterations', '1', prompt],
  unavailableHint: 'Install ralphy and ensure it is on PATH.',
  failureHint: 'Ensure Cursor integration is configured in ralphy.',
});
