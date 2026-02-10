import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { storiesToBeads } from '../beads/adapter.js';
import { renderTasksMarkdown } from '../beads/tasks-md.js';
import { TaskManager } from '../tasks/index.js';
import { logInfo } from '../utils/logging.js';
import type { PipelineContext } from './types.js';

export async function syncPhase(ctx: PipelineContext): Promise<PipelineContext> {
  logInfo('Phase 5 (sync): convert stories to Beads issues');
  const storyPath = path.join(ctx.projectRoot, '_bmad-output', 'stories', 'epics.md');
  const tasks = await storiesToBeads([storyPath]);
  if (tasks.length === 0) {
    throw new Error('sync: no tasks parsed from stories file');
  }
  const manager = await TaskManager.create(ctx.projectRoot);
  const existingByStoryAndTitle = new Map(
    manager.getAll().map((task) => [`${task.storyId}\u0000${task.title}`, task]),
  );
  const created = tasks.map((task) => {
    const key = `${task.storyId}\u0000${task.title}`;
    const existing = existingByStoryAndTitle.get(key);
    if (existing) {
      for (const dep of task.dependencies) {
        manager.addDependency(existing.id, dep);
      }
      return manager.get(existing.id) ?? existing;
    }
    const inserted = manager.create({
      storyId: task.storyId,
      title: task.title,
      description: task.description,
      dependencies: task.dependencies,
      status: 'open',
    });
    existingByStoryAndTitle.set(key, inserted);
    return inserted;
  });
  const tasksMd = renderTasksMarkdown(created.map((task) => ({ id: task.id, title: task.title, status: task.status })));
  await writeFile(path.join(ctx.projectRoot, 'tasks.md'), tasksMd, 'utf-8');

  logInfo(`sync: created ${created.length} tasks in .bemadralphy/tasks.db`);

  return ctx;
}
