import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export type CommandRunner = (
  command: string,
  args?: string[],
  cwd?: string,
) => Promise<{ stdout: string; stderr: string }>;

export type CommandExistsRunner = (command: string) => Promise<boolean>;

type CommandRunners = {
  runCommand: CommandRunner;
  commandExists: CommandExistsRunner;
};

const defaultRunners: CommandRunners = {
  runCommand: async (
    command: string,
    args: string[] = [],
    cwd?: string,
  ): Promise<{ stdout: string; stderr: string }> => {
    try {
      const result = await execFileAsync(command, args, { cwd });
      return { stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
    } catch (error) {
      const err = error as {
        message?: string;
        stdout?: string;
        stderr?: string;
        code?: string | number;
      };
      const rendered = `${command} ${args.join(' ')}`.trim();
      const details = [err.stderr, err.stdout, err.message].filter(Boolean).join(' | ');
      throw new Error(
        `Command failed (${rendered})${cwd ? ` in ${cwd}` : ''}` +
          `${err.code ? ` [code=${err.code}]` : ''}: ${details || 'no details'}`,
      );
    }
  },
  commandExists: async (command: string): Promise<boolean> => {
    try {
      await execFileAsync('which', [command]);
      return true;
    } catch {
      return false;
    }
  },
};

let runners: CommandRunners = { ...defaultRunners };

export async function runCommand(
  command: string,
  args: string[] = [],
  cwd?: string,
): Promise<{ stdout: string; stderr: string }> {
  return runners.runCommand(command, args, cwd);
}

export async function commandExists(command: string): Promise<boolean> {
  return runners.commandExists(command);
}

export function setCommandRunners(overrides: Partial<CommandRunners>): void {
  runners = {
    ...runners,
    ...overrides,
  };
}

export function resetCommandRunners(): void {
  runners = { ...defaultRunners };
}

export async function assertCommandExists(command: string, hint?: string): Promise<void> {
  const exists = await commandExists(command);
  if (!exists) {
    throw new Error(
      hint
        ? `Missing required CLI "${command}". ${hint}`
        : `Missing required CLI "${command}". Install it and ensure it is on PATH.`,
    );
  }
}
