import { createCliAdapter } from './cli-adapter.js';

export const ralphyAdapter = createCliAdapter({
  name: 'ralphy',
  commandName: 'ralphy',
  hasNativeSwarm: false,
  buildArgs: (_task, prompt) => ['--max-iterations', '1', prompt],
  unavailableHint: 'Install ralphy and ensure it is on PATH.',
  failureHint: 'Ensure ralphy is initialized and authenticated.',
});
