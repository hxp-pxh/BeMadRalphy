import { createCliAdapter } from './cli-adapter.js';

export const copilotAdapter = createCliAdapter({
  name: 'copilot',
  commandName: 'ralphy',
  hasNativeSwarm: false,
  buildArgs: (_task, prompt) => ['--copilot', '--max-iterations', '1', prompt],
  unavailableHint: 'Install ralphy and ensure it is on PATH.',
  failureHint: 'Ensure GitHub Copilot integration is configured in ralphy.',
});
