import { createCliAdapter } from './cli-adapter.js';

export const codexAdapter = createCliAdapter({
  name: 'codex',
  commandName: 'codex',
  hasNativeSwarm: true,
  ralphyFlag: '--codex',
});
