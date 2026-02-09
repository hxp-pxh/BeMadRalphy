export type PipelineMode = 'auto' | 'hybrid' | 'supervised';

export type PipelineContext = {
  runId: string;
  mode: PipelineMode;
  dryRun: boolean;
};
