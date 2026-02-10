import type { TaskDatabase } from './db.js';
import { openTaskDatabase } from './db.js';

export type TaskStatus = 'open' | 'in_progress' | 'blocked' | 'done' | 'failed';

export type Task = {
  id: string;
  storyId: string;
  title: string;
  description: string;
  status: TaskStatus;
  dependencies: string[];
  assignee?: string;
  output?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
};

export type NewTask = Omit<
  Task,
  'id' | 'status' | 'dependencies' | 'createdAt' | 'updatedAt' | 'closedAt'
> & {
  id?: string;
  status?: TaskStatus;
  dependencies?: string[];
};

export class TaskManager {
  private readonly db: TaskDatabase;

  private constructor(db: TaskDatabase) {
    this.db = db;
  }

  static async create(projectRoot: string): Promise<TaskManager> {
    return new TaskManager(await openTaskDatabase(projectRoot));
  }

  create(task: NewTask): Task {
    const now = new Date().toISOString();
    const id = task.id ?? generateTaskId(task.storyId, task.title);
    this.db
      .prepare(
        `INSERT INTO tasks (
          id, story_id, title, description, status, assignee, output, error, created_at, updated_at
        ) VALUES (
          @id, @story_id, @title, @description, @status, @assignee, @output, @error, @created_at, @updated_at
        )`,
      )
      .run({
        id,
        story_id: task.storyId,
        title: task.title,
        description: task.description,
        status: task.status ?? 'open',
        assignee: task.assignee ?? null,
        output: task.output ?? null,
        error: task.error ?? null,
        created_at: now,
        updated_at: now,
      });
    for (const dep of task.dependencies ?? []) {
      this.addDependency(id, dep);
    }
    const created = this.get(id);
    if (!created) {
      throw new Error(`task manager create failed for id=${id}`);
    }
    return created;
  }

  update(id: string, patch: Partial<Task>): Task {
    const existing = this.get(id);
    if (!existing) {
      throw new Error(`task not found: ${id}`);
    }
    const next = {
      story_id: patch.storyId ?? existing.storyId,
      title: patch.title ?? existing.title,
      description: patch.description ?? existing.description,
      status: patch.status ?? existing.status,
      assignee: patch.assignee ?? existing.assignee ?? null,
      output: patch.output ?? existing.output ?? null,
      error: patch.error ?? existing.error ?? null,
      updated_at: new Date().toISOString(),
      closed_at:
        (patch.status ?? existing.status) === 'done'
          ? existing.closedAt ?? new Date().toISOString()
          : null,
      id,
    };
    this.db
      .prepare(
        `UPDATE tasks SET
          story_id=@story_id,
          title=@title,
          description=@description,
          status=@status,
          assignee=@assignee,
          output=@output,
          error=@error,
          updated_at=@updated_at,
          closed_at=@closed_at
        WHERE id=@id`,
      )
      .run(next);
    const updated = this.get(id);
    if (!updated) {
      throw new Error(`task update failed for id=${id}`);
    }
    return updated;
  }

  close(id: string): Task {
    return this.update(id, { status: 'done', error: undefined });
  }

  fail(id: string, error: string): Task {
    return this.update(id, { status: 'failed', error });
  }

  retry(id: string): Task {
    return this.update(id, { status: 'open', error: undefined });
  }

  get(id: string): Task | null {
    const row = this.db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(id) as TaskRow | undefined;
    if (!row) {
      return null;
    }
    return this.toTask(row);
  }

  getAll(): Task[] {
    const rows = this.db.prepare(`SELECT * FROM tasks ORDER BY created_at ASC`).all() as TaskRow[];
    return rows.map((row) => this.toTask(row));
  }

  getByStatus(status: TaskStatus): Task[] {
    const rows = this.db
      .prepare(`SELECT * FROM tasks WHERE status = ? ORDER BY created_at ASC`)
      .all(status) as TaskRow[];
    return rows.map((row) => this.toTask(row));
  }

  getReady(): Task[] {
    const rows = this.db
      .prepare(
        `WITH RECURSIVE
          blocked_directly AS (
            SELECT DISTINCT d.task_id
            FROM dependencies d
            JOIN tasks blocker ON d.depends_on_id = blocker.id
            WHERE d.dep_type = 'blocks'
              AND blocker.status IN ('open','in_progress','blocked')
          ),
          blocked_transitively AS (
            SELECT task_id, 0 as depth FROM blocked_directly
            UNION ALL
            SELECT d.task_id, bt.depth + 1
            FROM blocked_transitively bt
            JOIN dependencies d ON d.depends_on_id = bt.task_id
            WHERE d.dep_type = 'blocks' AND bt.depth < 50
          )
        SELECT t.*
        FROM tasks t
        WHERE t.status = 'open'
          AND NOT EXISTS (
            SELECT 1 FROM blocked_transitively bt WHERE bt.task_id = t.id
          )
        ORDER BY t.priority ASC, t.created_at ASC`,
      )
      .all() as TaskRow[];
    return rows.map((row) => this.toTask(row));
  }

  addDependency(taskId: string, dependsOnId: string, depType: string = 'blocks'): void {
    this.db
      .prepare(
        `INSERT OR IGNORE INTO dependencies (task_id, depends_on_id, dep_type)
         VALUES (@task_id, @depends_on_id, @dep_type)`,
      )
      .run({ task_id: taskId, depends_on_id: dependsOnId, dep_type: depType });
  }

  private toTask(row: TaskRow): Task {
    const dependencies = this.db
      .prepare(`SELECT depends_on_id FROM dependencies WHERE task_id = ? ORDER BY depends_on_id`)
      .all(row.id) as Array<{ depends_on_id: string }>;

    return {
      id: row.id,
      storyId: row.story_id ?? '',
      title: row.title,
      description: row.description ?? '',
      status: row.status,
      dependencies: dependencies.map((entry) => entry.depends_on_id),
      assignee: row.assignee ?? undefined,
      output: row.output ?? undefined,
      error: row.error ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      closedAt: row.closed_at ?? undefined,
    };
  }
}

type TaskRow = {
  id: string;
  story_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  assignee: string | null;
  output: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
};

function generateTaskId(storyId: string, title: string): string {
  const normalized = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const source = `${storyId}:${title}`.toLowerCase();
  let hash = 5381;
  for (let index = 0; index < source.length; index += 1) {
    hash = (hash * 33) ^ source.charCodeAt(index);
  }
  const suffix = (hash >>> 0).toString(36).padStart(6, '0').slice(-6);
  return `${normalized || 'task'}-${suffix}`;
}
