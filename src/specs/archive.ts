import { logInfo } from '../utils/logging.js';
import { commandExists, runCommand } from '../utils/exec.js';

export async function archiveSpecChange(projectRoot: string, changeName?: string): Promise<void> {
  if (!(await commandExists('openspec'))) {
    logInfo('specs: openspec CLI not found; skipping archive');
    return;
  }

  const args = ['archive', '-y'];
  if (changeName) {
    args.push(changeName);
  }

  await runCommand('openspec', args, projectRoot);
  logInfo('specs: openspec archive completed');
}
