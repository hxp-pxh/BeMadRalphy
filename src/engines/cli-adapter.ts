import { readFile } from 'node:fs/promises';
import path from 'node:path';
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

const CONTEXT_FILES = ['AGENTS.md', 'CLAUDE.md', '.cursorrules'] as const;
const CONTEXT_FILE_BYTES = 3000;

async function readContextFile(projectRoot: string, filename: string): Promise<string | null> {
  try {
    const fullPath = path.join(projectRoot, filename);
    const content = await readFile(fullPath, 'utf8');
    const trimmed = content.trim();
    if (!trimmed) {
      return null;
    }
    return trimmed.slice(0, CONTEXT_FILE_BYTES);
  } catch {
    return null;
  }
}

async function taskPrompt(task: EngineTask, cwd?: string): Promise<string> {
  const description = task.description?.trim() ? `\n\n${task.description.trim()}` : '';
  const contextSections: string[] = [];
  const projectRoot = cwd ?? process.cwd();

  for (const filename of CONTEXT_FILES) {
    const content = await readContextFile(projectRoot, filename);
    if (!content) {
      continue;
    }
    contextSections.push(`### ${filename}\n${content}`);
  }

  const contextBlock =
    contextSections.length > 0
      ? `\n\nProject context and working agreements:\n${contextSections.join('\n\n')}`
      : '';

  return [
    'You are executing a single implementation task inside this repository.',
    'Do not mark the task complete until code changes and verification commands have been run and checked.',
    'Prefer small, focused edits and preserve existing behavior unless task requirements call for change.',
    '',
    `Task ID: ${task.id}`,
    `Title: ${task.title}`,
    description,
    contextBlock,
  ].join('\n');
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
      const prompt = await taskPrompt(task, cwd);
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
