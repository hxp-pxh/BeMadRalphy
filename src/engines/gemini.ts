import { createCliAdapter } from './cli-adapter.js';

export const geminiAdapter = createCliAdapter({
  name: 'gemini',
  commandName: 'gemini',
  hasNativeSwarm: false,
});
