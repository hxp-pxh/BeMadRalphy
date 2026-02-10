import type { EngineAdapter } from '../engines/types.js';
import type { PipelineContext } from '../phases/types.js';

export type PhaseName =
  | 'intake'
  | 'planning'
  | 'steering'
  | 'scaffold'
  | 'sync'
  | 'execute'
  | 'verify'
  | 'post';

export type PhaseHook = (context: PipelineContext) => Promise<void> | void;

export type PluginApi = {
  registerEngine: (name: string, adapter: EngineAdapter) => void;
  onBeforePhase: (phase: PhaseName, hook: PhaseHook) => void;
  onAfterPhase: (phase: PhaseName, hook: PhaseHook) => void;
};

export type BemadPlugin = {
  name: string;
  register: (api: PluginApi) => Promise<void> | void;
};
