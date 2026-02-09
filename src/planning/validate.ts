import { access, readFile } from 'node:fs/promises';

export type BmadOutputs = {
  productBriefPath: string;
  prdPath: string;
  architecturePath: string;
  storiesPath: string;
};

export async function validateBmadOutputs(outputs: BmadOutputs): Promise<void> {
  await assertFileHasContent(outputs.productBriefPath, 'product brief');
  await assertFileHasContent(outputs.prdPath, 'PRD');
  await assertFileHasContent(outputs.architecturePath, 'architecture');
  await assertFileHasContent(outputs.storiesPath, 'stories');
}

async function assertFileHasContent(path: string, label: string): Promise<void> {
  try {
    await access(path);
  } catch {
    throw new Error(`Missing ${label} output: ${path}`);
  }
  const contents = await readFile(path, 'utf-8');
  if (!contents.trim()) {
    throw new Error(`Empty ${label} output: ${path}`);
  }
}
