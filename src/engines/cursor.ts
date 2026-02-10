import { createCliAdapter } from './cli-adapter.js';

export const cursorAdapter = createCliAdapter({
  name: 'cursor',
  commandName: 'cursor',
  hasNativeSwarm: false,
  ralphyFlag: '--cursor',
});
