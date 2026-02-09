export type EngineTask = {
  id: string;
  title: string;
  description?: string;
};

export type ExecuteOptions = {
  cwd?: string;
  dryRun?: boolean;
};

export type TaskResult = {
  status: 'success' | 'failed' | 'skipped';
  output?: string;
  error?: string;
};

export interface EngineAdapter {
  name: string;
  hasNativeSwarm: boolean;
  permissionFlags: string[];
  checkAvailable(): Promise<boolean>;
  execute(task: EngineTask, options: ExecuteOptions): Promise<TaskResult>;
}
