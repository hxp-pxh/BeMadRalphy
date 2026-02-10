import { logInfo } from '../utils/logging.js';
import { validateSpecs } from './validate.js';

export async function mergeSpecDeltas(projectRoot: string): Promise<void> {
  await validateSpecs(projectRoot);
  logInfo('specs: internal spec validation completed');
}
