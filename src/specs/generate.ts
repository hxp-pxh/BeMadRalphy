import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { logInfo } from '../utils/logging.js';

export async function generateSpecs(projectRoot: string): Promise<void> {
  const root = path.join(projectRoot, 'openspec');
  await mkdir(path.join(root, 'specs'), { recursive: true });
  await mkdir(path.join(root, 'changes', 'archive'), { recursive: true });
  await writeFile(
    path.join(root, 'config.yaml'),
    ['schema: spec-driven', 'version: 1', 'generatedBy: bemadralphy'].join('\n'),
    'utf-8',
  );
  logInfo('specs: internal openspec scaffold initialized');
}
