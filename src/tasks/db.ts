import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import Database from 'better-sqlite3';

export type TaskDatabase = Database.Database;

export async function openTaskDatabase(projectRoot: string): Promise<TaskDatabase> {
  const dir = path.join(projectRoot, '.bemadralphy');
  await mkdir(dir, { recursive: true });
  const dbPath = path.join(dir, 'tasks.db');
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  migrate(db);
  return db;
}

function migrate(db: TaskDatabase): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      story_id TEXT,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','in_progress','blocked','done','failed')),
      priority INTEGER NOT NULL DEFAULT 2 CHECK(priority >= 0 AND priority <= 4),
      issue_type TEXT NOT NULL DEFAULT 'task',
      assignee TEXT,
      output TEXT,
      error TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      closed_at TEXT
    );
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS dependencies (
      task_id TEXT NOT NULL,
      depends_on_id TEXT NOT NULL,
      dep_type TEXT NOT NULL DEFAULT 'blocks',
      PRIMARY KEY (task_id, depends_on_id),
      FOREIGN KEY (task_id) REFERENCES tasks(id),
      FOREIGN KEY (depends_on_id) REFERENCES tasks(id)
    );
  `);
}
