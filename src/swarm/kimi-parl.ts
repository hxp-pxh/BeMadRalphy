import { logInfo } from '../utils/logging.js';
import { assertCommandExists, runCommand } from '../utils/exec.js';

export async function runKimiParlBatch(projectRoot: string, maxParallel: number): Promise<void> {
  logInfo(`swarm: running Kimi batch (maxParallel=${maxParallel})`);
  await assertCommandExists('kimi', 'Install Kimi CLI and ensure it is on PATH.');
  await runCommand('kimi', ['--parallel', '--max-parallel', String(maxParallel)], projectRoot);
}
