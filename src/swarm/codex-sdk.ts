import { logInfo } from '../utils/logging.js';
import { runCommand } from '../utils/exec.js';

export async function runCodexAgentsBatch(projectRoot: string, maxParallel: number): Promise<void> {
  logInfo(`swarm: running Codex batch (maxParallel=${maxParallel})`);
  await runCommand(
    'ralphy',
    ['--codex', '--parallel', '--max-parallel', String(maxParallel), '--max-iterations', '1'],
    projectRoot,
  );
}
