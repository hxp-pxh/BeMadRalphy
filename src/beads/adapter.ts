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
    let currentTask: { storyId: string; title: string; descriptionLines: string[]; dependencies: string[] } | null = null;

    const flushTask = () => {
      if (currentTask) {
        tasks.push({
          storyId: currentTask.storyId,
          title: currentTask.title,
          description: currentTask.descriptionLines.length > 0
            ? currentTask.descriptionLines.join('\n').trim()
            : 'No implementation steps provided.',
          dependencies: currentTask.dependencies,
        });
      }
    };

    for (const line of lines) {
      // New story header (### Story X.Y: Title)
      if (line.startsWith('### ')) {
        flushTask();
        currentTask = {
          storyId: `story-${counter++}`,
          title: line.replace(/^###\s+/, ''),
          descriptionLines: [],
          dependencies: [],
        };
      } 
      // New epic header (## Epic X) - flush but don't create task for the epic itself
      else if (line.startsWith('## ')) {
        flushTask();
        currentTask = null;
      }
      // Dependency line
      else if (line.trim().toLowerCase().startsWith('- depends on:')) {
        if (currentTask) {
          const value = line.split(':', 2)[1]?.trim() ?? '';
          if (value) {
            const parsed = value
              .split(',')
              .map((entry) => entry.trim())
              .filter(Boolean);
            for (const dependency of parsed) {
              if (!currentTask.dependencies.includes(dependency)) {
                currentTask.dependencies.push(dependency);
              }
            }
          }
        }
      }
      // Any other content under a story - capture it as description
      else if (currentTask && line.trim()) {
        currentTask.descriptionLines.push(line);
      }
    }

    // Don't forget the last task
    flushTask();
  }

  return tasks;
}
