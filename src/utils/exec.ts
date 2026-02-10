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
    const result = await execFileAsync(command, args, { cwd });
    return { stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
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
