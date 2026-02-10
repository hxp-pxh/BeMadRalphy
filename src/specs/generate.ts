import { logInfo } from '../utils/logging.js';
import { assertCommandExists, runCommand } from '../utils/exec.js';

export async function generateSpecs(projectRoot: string): Promise<void> {
  await assertCommandExists('openspec', 'Install with: npm install -g @fission-ai/openspec');
  await runCommand('openspec', ['init', projectRoot, '--tools', 'none'], projectRoot);
  logInfo('specs: openspec initialized');
}
