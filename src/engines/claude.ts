import { createStubAdapter } from './stub.js';

export const claudeAdapter = createStubAdapter('claude', true, ['--dangerously-skip-permissions']);
