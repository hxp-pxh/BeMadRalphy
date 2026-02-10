import { mkdir, rename } from 'node:fs/promises';
import path from 'node:path';
import { logInfo } from '../utils/logging.js';
import { validateSpecs } from './validate.js';

export async function archiveSpecChange(projectRoot: string, changeName?: string): Promise<void> {
  await validateSpecs(projectRoot);
  if (!changeName) {
    logInfo('specs: no change name provided; archive skipped');
    return;
  }

  const changesRoot = path.join(projectRoot, 'openspec', 'changes');
  const source = path.join(changesRoot, changeName);
  const archiveDir = path.join(changesRoot, 'archive');
  await mkdir(archiveDir, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 10);
  const destination = path.join(archiveDir, `${stamp}-${changeName}`);
  await rename(source, destination);
  logInfo(`specs: archived change "${changeName}" to ${destination}`);
}
