import { chmod, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

export async function createFakeCliBin(
  parentDir: string,
  scripts: Record<string, string>,
): Promise<string> {
  const binDir = path.join(parentDir, 'fake-bin');
  await mkdir(binDir, { recursive: true });

  for (const [name, body] of Object.entries(scripts)) {
    const scriptPath = path.join(binDir, name);
    await writeFile(scriptPath, `#!/usr/bin/env bash\nset -euo pipefail\n${body}\n`, 'utf-8');
    await chmod(scriptPath, 0o755);
  }

  return binDir;
}
