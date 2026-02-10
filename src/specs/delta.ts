import { logInfo } from '../utils/logging.js';
import { commandExists, runCommand } from '../utils/exec.js';

export async function mergeSpecDeltas(projectRoot: string): Promise<void> {
  if (!(await commandExists('openspec'))) {
    logInfo('specs: openspec CLI not found; skipping validation');
    return;
  }
  await runCommand('openspec', ['validate', '--all', '--no-interactive'], projectRoot);
  logInfo('specs: openspec validation completed');
}
