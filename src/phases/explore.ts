import { logInfo } from '../utils/logging.js';

export async function explorePhase(query: string): Promise<void> {
  logInfo(`Phase 0 (explore): ${query}`);
}
