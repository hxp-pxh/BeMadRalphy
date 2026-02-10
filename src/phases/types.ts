export type PipelineMode = 'auto' | 'hybrid' | 'supervised';
export type ExecutionProfile = 'safe' | 'balanced' | 'fast';
export type AudienceProfile = 'solo-dev' | 'agency-team' | 'product-team' | 'enterprise-team';

export type IntakeData = {
  sourceFile: string;
  frontmatter: Record<string, unknown>;
  body: string;
  createdAt: string;
};

export type PipelineContext = {
  runId: string;
  mode: PipelineMode;
  dryRun: boolean;
  projectRoot: string;
  intakePath?: string;
  intake?: IntakeData;
  engine?: string;
  planningEngine?: string;
  maxParallel?: number;
  executionProfile?: ExecutionProfile;
  audienceProfile?: AudienceProfile;
  budget?: number;
  brownfield?: boolean;
  swarm?: 'native' | 'process' | 'off';
  createPr?: boolean;
};
