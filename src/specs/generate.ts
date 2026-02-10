import { logInfo } from '../utils/logging.js';
import { commandExists, runCommand } from '../utils/exec.js';

export async function generateSpecs(projectRoot: string): Promise<void> {
  if (!(await commandExists('openspec'))) {
    logInfo('specs: openspec CLI not found; skipping init');
    return;
  }

  await runCommand('openspec', ['init', projectRoot, '--tools', 'none'], projectRoot);
  logInfo('specs: openspec initialized');
}
