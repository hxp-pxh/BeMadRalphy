import { createCliAdapter } from './cli-adapter.js';

export const ralphyAdapter = createCliAdapter({
  name: 'ralphy',
  commandName: 'ralphy',
  hasNativeSwarm: false,
});
