import { createCliAdapter } from './cli-adapter.js';

export const geminiAdapter = createCliAdapter({
  name: 'gemini',
  commandName: 'gemini',
  hasNativeSwarm: false,
  buildArgs: (_task, prompt) => [prompt],
  unavailableHint: 'Install Gemini CLI and ensure it is on PATH.',
  failureHint: 'Ensure Gemini CLI is authenticated.',
});
