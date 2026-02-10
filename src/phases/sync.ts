import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { storiesToBeads } from '../beads/adapter.js';
import { renderTasksMarkdown } from '../beads/tasks-md.js';
import { BeadsWriter } from '../beads/writer.js';
import { assertCommandExists } from '../utils/exec.js';
import { logInfo } from '../utils/logging.js';
import type { PipelineContext } from './types.js';

export async function syncPhase(ctx: PipelineContext): Promise<PipelineContext> {
  logInfo('Phase 5 (sync): convert stories to Beads issues');
  const storyPath = path.join(ctx.projectRoot, '_bmad-output', 'stories', 'epics.md');
  const tasks = await storiesToBeads([storyPath]);
  if (tasks.length === 0) {
    throw new Error('sync: no tasks parsed from stories file');
  }
  const tasksMd = renderTasksMarkdown(
    tasks.map((task) => ({ id: task.id, title: task.title, status: 'ready' })),
  );
  await writeFile(path.join(ctx.projectRoot, 'tasks.md'), tasksMd, 'utf-8');

  await assertCommandExists('bd', 'Install with: npm install -g @beads/bd');
  const writer = new BeadsWriter(ctx.projectRoot);
  await writer.init();
  for (const task of tasks) {
    await writer.create(task.title, 'Generated from BMAD stories');
  }

  return ctx;
}
