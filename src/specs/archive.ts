import { logInfo } from '../utils/logging.js';
import { assertCommandExists, runCommand } from '../utils/exec.js';

export async function archiveSpecChange(projectRoot: string, changeName?: string): Promise<void> {
  await assertCommandExists('openspec', 'Install with: npm install -g @fission-ai/openspec');

  const args = ['archive', '-y'];
  if (changeName) {
    args.push(changeName);
  }

  await runCommand('openspec', args, projectRoot);
  logInfo('specs: openspec archive completed');
}
