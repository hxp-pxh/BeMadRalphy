import { createCliAdapter } from './cli-adapter.js';

export const claudeAdapter = createCliAdapter({
  name: 'claude',
  commandName: 'claude',
  hasNativeSwarm: true,
  permissionFlags: ['--dangerously-skip-permissions'],
  ralphyFlag: '--claude',
});
