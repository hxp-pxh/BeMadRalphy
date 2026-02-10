import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { storiesToBeads } from '../beads/adapter.js';
import { renderTasksMarkdown } from '../beads/tasks-md.js';
import { BeadsWriter } from '../beads/writer.js';
import { logInfo } from '../utils/logging.js';
import type { PipelineContext } from './types.js';

export async function syncPhase(ctx: PipelineContext): Promise<PipelineContext> {
  logInfo('Phase 5 (sync): convert stories to Beads issues');
  const storyPath = path.join(ctx.projectRoot, '_bmad-output', 'stories', 'epics.md');
  try {
    const tasks = await storiesToBeads([storyPath]);
    if (tasks.length === 0) {
      logInfo('sync: no tasks parsed from stories file; skipping bead creation');
      return ctx;
    }
    const tasksMd = renderTasksMarkdown(
      tasks.map((task) => ({ id: task.id, title: task.title, status: 'ready' })),
    );
    await writeFile(path.join(ctx.projectRoot, 'tasks.md'), tasksMd, 'utf-8');

    const writer = new BeadsWriter(ctx.projectRoot);
    if (await writer.isAvailable()) {
      await writer.init();
      for (const task of tasks) {
        await writer.create(task.title, 'Generated from BMAD stories');
      }
    } else {
      const beadsDir = path.join(ctx.projectRoot, '.beads');
      await mkdir(beadsDir, { recursive: true });
      const issuesPath = path.join(beadsDir, 'issues.jsonl');
      const issuesLines = tasks.map((t) => JSON.stringify({ id: t.id, title: t.title }));
      await writeFile(issuesPath, `${issuesLines.join('\n')}\n`, 'utf-8');
    }
  } catch (error) {
    logInfo(`sync skipped: ${(error as Error).message}`);
  }
  return ctx;
}
