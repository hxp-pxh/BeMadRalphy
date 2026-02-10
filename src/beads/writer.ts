import { commandExists, runCommand } from '../utils/exec.js';
import { logInfo } from '../utils/logging.js';

export class BeadsWriter {
  private queue: Promise<void> = Promise.resolve();
  private availablePromise: Promise<boolean>;
  private cwd: string;

  constructor(projectRoot: string) {
    this.cwd = projectRoot;
    this.availablePromise = commandExists('bd');
  }

  async isAvailable(): Promise<boolean> {
    return this.availablePromise;
  }

  async init(): Promise<void> {
    await this.enqueue(async () => {
      if (!(await this.isAvailable())) {
        logInfo('BeadsWriter: bd not available; skipping init');
        return;
      }
      await runCommand('bd', ['init'], this.cwd);
    });
  }

  async create(title: string, body: string): Promise<string> {
    return this.enqueue(async () => {
      if (!(await this.isAvailable())) {
        throw new Error('BeadsWriter.create: bd not available');
      }
      const { stdout } = await runCommand('bd', ['create', title, '--body', body], this.cwd);
      const id = stdout.trim();
      if (!id) {
        throw new Error('BeadsWriter.create: bd did not return an issue id');
      }
      return id;
    });
  }

  async update(id: string, body: string): Promise<void> {
    await this.enqueue(async () => {
      if (!(await this.isAvailable())) {
        logInfo('BeadsWriter.update: bd not available; skipping');
        return;
      }
      await runCommand('bd', ['update', id, '--body', body], this.cwd);
    });
  }

  async close(id: string): Promise<void> {
    await this.enqueue(async () => {
      if (!(await this.isAvailable())) {
        logInfo('BeadsWriter.close: bd not available; skipping');
        return;
      }
      await runCommand('bd', ['close', id], this.cwd);
    });
  }

  private enqueue<T>(fn: () => Promise<T>): Promise<T> {
    const next = this.queue.then(fn, fn);
    this.queue = next.then(
      () => undefined,
      () => undefined,
    );
    return next;
  }
}
