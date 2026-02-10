import { logInfo } from '../utils/logging.js';
import { runCommand } from '../utils/exec.js';

export async function runKimiParlBatch(projectRoot: string, maxParallel: number): Promise<void> {
  logInfo(`swarm: running Kimi batch (maxParallel=${maxParallel})`);
  await runCommand('kimi', ['--parallel', '--max-parallel', String(maxParallel)], projectRoot);
}
