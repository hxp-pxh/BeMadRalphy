import { logInfo } from './utils/logging.js';

export type FileLock = {
  path: string;
  taskId: string;
  acquiredAt: string;
};

export class FileLockManager {
  async acquire(_path: string, _taskId: string): Promise<FileLock> {
    logInfo('lock acquire not implemented yet');
    return { path: _path, taskId: _taskId, acquiredAt: new Date().toISOString() };
  }

  async release(_path: string, _taskId: string): Promise<void> {
    logInfo('lock release not implemented yet');
  }
}
