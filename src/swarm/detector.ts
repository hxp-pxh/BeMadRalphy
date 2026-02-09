import { engineAdapters } from '../engines/index.js';
import type { SwarmCapability, SwarmMode } from './types.js';

export function detectSwarmCapability(engineName: string): SwarmCapability {
  const adapter = engineAdapters[engineName];
  if (!adapter) {
    return { supportsNative: false, reason: 'unknown engine' };
  }
  return { supportsNative: adapter.hasNativeSwarm };
}

export function resolveSwarmMode(engineName: string, override?: SwarmMode): SwarmMode {
  if (override) {
    return override;
  }
  const capability = detectSwarmCapability(engineName);
  return capability.supportsNative ? 'native' : 'process';
}
