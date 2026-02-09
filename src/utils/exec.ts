import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export async function runCommand(
  command: string,
  args: string[] = [],
  cwd?: string,
): Promise<{ stdout: string; stderr: string }> {
  const result = await execFileAsync(command, args, { cwd });
  return { stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
}

export async function commandExists(command: string): Promise<boolean> {
  try {
    await execFileAsync('which', [command]);
    return true;
  } catch {
    return false;
  }
}
