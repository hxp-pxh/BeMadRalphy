import { claudeAdapter } from './claude.js';

// Backward-compatible alias: "ralphy" now delegates to Claude by default.
export const ralphyAdapter = {
  ...claudeAdapter,
  name: 'ralphy',
};
