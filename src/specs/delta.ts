import { logInfo } from '../utils/logging.js';
import { assertCommandExists, runCommand } from '../utils/exec.js';

export async function mergeSpecDeltas(projectRoot: string): Promise<void> {
  await assertCommandExists('openspec', 'Install with: npm install -g @fission-ai/openspec');
  await runCommand('openspec', ['validate', '--all', '--no-interactive'], projectRoot);
  logInfo('specs: openspec validation completed');
}
