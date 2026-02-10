import { readFile } from 'node:fs/promises';

export type ParsedTask = {
  storyId: string;
  title: string;
  description: string;
  dependencies: string[];
};

export async function storiesToBeads(storyPaths: string[]): Promise<ParsedTask[]> {
  const tasks: ParsedTask[] = [];
  let counter = 1;

  for (const storyPath of storyPaths) {
    const contents = await readFile(storyPath, 'utf-8');
    const lines = contents.split(/\r?\n/);
    let currentDependencies: string[] = [];
    for (const line of lines) {
      if (line.startsWith('### ')) {
        tasks.push({
          storyId: `story-${counter++}`,
          title: line.replace(/^###\s+/, ''),
          description: 'Generated from planning stories.',
          dependencies: currentDependencies,
        });
        currentDependencies = [];
      } else if (line.trim().toLowerCase().startsWith('- depends on:')) {
        const value = line.split(':', 2)[1]?.trim() ?? '';
        if (value) {
          currentDependencies = value
            .split(',')
            .map((entry) => entry.trim())
            .filter(Boolean);
        }
      }
    }
  }

  return tasks;
}
