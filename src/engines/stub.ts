import { commandExists } from '../utils/exec.js';
import { logInfo } from '../utils/logging.js';
import type { EngineAdapter, EngineTask, ExecuteOptions, TaskResult } from './types.js';

export function createStubAdapter(
  name: string,
  hasNativeSwarm: boolean,
  permissionFlags: string[] = [],
  commandName?: string,
): EngineAdapter {
  return {
    name,
    hasNativeSwarm,
    permissionFlags,
    async checkAvailable(): Promise<boolean> {
      if (!commandName) {
        return false;
      }
      return commandExists(commandName);
    },
    async execute(task: EngineTask, options: ExecuteOptions): Promise<TaskResult> {
      logInfo(
        `engine "${name}" not implemented (task=${task.id}, dryRun=${Boolean(options.dryRun)})`,
      );
      return { status: 'skipped', output: 'engine not implemented' };
    },
  };
}
