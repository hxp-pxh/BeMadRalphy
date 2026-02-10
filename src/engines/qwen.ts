import { createCliAdapter } from './cli-adapter.js';

export const qwenAdapter = createCliAdapter({
  name: 'qwen',
  commandName: 'qwen',
  hasNativeSwarm: false,
  ralphyFlag: '--qwen',
});
