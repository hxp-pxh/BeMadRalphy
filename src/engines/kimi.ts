import { createCliAdapter } from './cli-adapter.js';

export const kimiAdapter = createCliAdapter({
  name: 'kimi',
  commandName: 'kimi',
  hasNativeSwarm: true,
});
