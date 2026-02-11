import { copyFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { logInfo } from '../utils/logging.js';
import { assertCommandExists, runCommand } from '../utils/exec.js';

export async function runClaudeTeamsBatch(projectRoot: string, maxParallel: number): Promise<void> {
  logInfo(`swarm: running Claude teams batch (maxParallel=${maxParallel})`);
  
  // Ralphy expects PRD.md in root, but BeMadRalphy generates in _bmad-output/
  const bmadPrd = path.join(projectRoot, '_bmad-output', 'prd.md');
  const rootPrd = path.join(projectRoot, 'PRD.md');
  
  if (existsSync(bmadPrd) && !existsSync(rootPrd)) {
    logInfo('swarm: copying _bmad-output/prd.md to PRD.md for ralphy compatibility');
    copyFileSync(bmadPrd, rootPrd);
  }
  
  await assertCommandExists('ralphy', 'Install with: npm install -g ralphy-cli');
  await runCommand(
    'ralphy',
    ['--claude', '--parallel', '--max-parallel', String(maxParallel), '--max-iterations', '1'],
    projectRoot,
  );
}
