import { readFile } from 'node:fs/promises';

export type ParsedTask = {
  id: string;
  title: string;
};

export async function storiesToBeads(storyPaths: string[]): Promise<ParsedTask[]> {
  const tasks: ParsedTask[] = [];
  let counter = 1;

  for (const storyPath of storyPaths) {
    const contents = await readFile(storyPath, 'utf-8');
    const lines = contents.split(/\r?\n/);
    for (const line of lines) {
      if (line.startsWith('### ')) {
        tasks.push({ id: `bd-${counter++}`, title: line.replace(/^###\s+/, '') });
      }
    }
  }

  return tasks;
}
