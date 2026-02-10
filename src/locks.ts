export type FileLock = {
  path: string;
  taskId: string;
  acquiredAt: string;
};

export class FileLockManager {
  private readonly locks = new Map<string, FileLock>();

  async acquire(targetPath: string, taskId: string): Promise<FileLock> {
    const existing = this.locks.get(targetPath);
    if (existing && existing.taskId !== taskId) {
      throw new Error(`file lock conflict for "${targetPath}": held by ${existing.taskId}`);
    }

    const lock: FileLock = { path: targetPath, taskId, acquiredAt: new Date().toISOString() };
    this.locks.set(targetPath, lock);
    return lock;
  }

  async release(targetPath: string, taskId: string): Promise<void> {
    const existing = this.locks.get(targetPath);
    if (!existing) {
      return;
    }
    if (existing.taskId !== taskId) {
      throw new Error(`file lock mismatch for "${targetPath}": expected ${existing.taskId}, got ${taskId}`);
    }
    this.locks.delete(targetPath);
  }
}
