import { commandExists, runCommand } from '../utils/exec.js';
import type { EngineAdapter, EngineTask, TaskResult } from './types.js';

type CliAdapterOptions = {
  name: string;
  commandName: string;
  hasNativeSwarm: boolean;
  permissionFlags?: string[];
  buildArgs: (task: EngineTask, prompt: string) => string[];
  unavailableHint?: string;
  failureHint?: string;
};

function taskPrompt(task: EngineTask): string {
  const description = task.description?.trim() ? `\n\n${task.description.trim()}` : '';
  return `Task ID: ${task.id}\nTitle: ${task.title}${description}`;
}

export function createCliAdapter(options: CliAdapterOptions): EngineAdapter {
  const permissionFlags = options.permissionFlags ?? [];

  return {
    name: options.name,
    hasNativeSwarm: options.hasNativeSwarm,
    permissionFlags,
    async checkAvailable(): Promise<boolean> {
      return commandExists(options.commandName);
    },
    async execute(task, executeOptions): Promise<TaskResult> {
      const cwd = executeOptions.cwd;
      const prompt = taskPrompt(task);
      const args = options.buildArgs(task, prompt);

      if (executeOptions.dryRun) {
        return { status: 'skipped', output: `${options.name} dry run: ${task.id}` };
      }

      try {
        const result = await runCommand(options.commandName, args, cwd);
        return { status: 'success', output: result.stdout.trim() || result.stderr.trim() };
      } catch (error) {
        const hint = options.failureHint ?? options.unavailableHint;
        return {
          status: 'failed',
          error: `engine "${options.name}" failed: ${(error as Error).message}${hint ? ` (${hint})` : ''}`,
        };
      }
    },
  };
}
