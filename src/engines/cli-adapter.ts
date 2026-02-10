import { commandExists, runCommand } from '../utils/exec.js';
import type { EngineAdapter, EngineTask, TaskResult } from './types.js';

type CliAdapterOptions = {
  name: string;
  commandName: string;
  hasNativeSwarm: boolean;
  permissionFlags?: string[];
  ralphyFlag?: string;
};

function taskPrompt(task: EngineTask): string {
  const description = task.description?.trim() ? `\n\n${task.description.trim()}` : '';
  return `Task ID: ${task.id}\nTitle: ${task.title}${description}`;
}

export function createCliAdapter(options: CliAdapterOptions): EngineAdapter {
  const permissionFlags = options.permissionFlags ?? [];
  const hasRalphaFallback = Boolean(options.ralphyFlag);

  return {
    name: options.name,
    hasNativeSwarm: options.hasNativeSwarm,
    permissionFlags,
    async checkAvailable(): Promise<boolean> {
      if (await commandExists(options.commandName)) {
        return true;
      }
      return hasRalphaFallback ? commandExists('ralphy') : false;
    },
    async execute(task, executeOptions): Promise<TaskResult> {
      const cwd = executeOptions.cwd;
      const prompt = taskPrompt(task);

      if (executeOptions.dryRun) {
        return { status: 'skipped', output: `${options.name} dry run: ${task.id}` };
      }

      try {
        if (await commandExists(options.commandName)) {
          const result = await runCommand(options.commandName, [prompt], cwd);
          return { status: 'success', output: result.stdout.trim() };
        }

        if (hasRalphaFallback && (await commandExists('ralphy'))) {
          const args = [options.ralphyFlag as string, '--max-iterations', '1', prompt];
          const result = await runCommand('ralphy', args, cwd);
          return { status: 'success', output: result.stdout.trim() };
        }

        return {
          status: 'failed',
          error: `engine "${options.name}" unavailable: install ${options.commandName} or ralphy`,
        };
      } catch (error) {
        return { status: 'failed', error: (error as Error).message };
      }
    },
  };
}
