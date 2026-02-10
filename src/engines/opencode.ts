import { createCliAdapter } from './cli-adapter.js';

export const opencodeAdapter = createCliAdapter({
  name: 'opencode',
  commandName: 'opencode',
  hasNativeSwarm: false,
  ralphyFlag: '--opencode',
});
