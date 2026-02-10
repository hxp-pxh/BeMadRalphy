import { createCliAdapter } from './cli-adapter.js';

export const copilotAdapter = createCliAdapter({
  name: 'copilot',
  commandName: 'copilot',
  hasNativeSwarm: false,
  ralphyFlag: '--copilot',
});
