import { engineAdapters } from '../engines/index.js';
import type { ExecutionPolicy, ExecutionProfile, SwarmCapability, SwarmMode } from './types.js';

export function detectSwarmCapability(engineName: string): SwarmCapability {
  const adapter = engineAdapters[engineName];
  if (!adapter) {
    return { supportsNative: false, reason: 'unknown engine' };
  }
  return { supportsNative: adapter.hasNativeSwarm };
}

export function resolveSwarmMode(engineName: string, override?: SwarmMode): SwarmMode {
  return resolveExecutionPolicy(engineName, 'balanced', { swarmOverride: override }).swarmMode;
}

export function resolveExecutionPolicy(
  engineName: string,
  profile: ExecutionProfile = 'balanced',
  options: {
    swarmOverride?: SwarmMode;
    requestedParallel?: number;
  } = {},
): ExecutionPolicy {
  const capability = detectSwarmCapability(engineName);
  const maxParallel = resolveMaxParallel(profile, options.requestedParallel);
  const profileSwarmMode = profile === 'safe' ? 'process' : capability.supportsNative ? 'native' : 'process';
  const swarmMode = options.swarmOverride ?? profileSwarmMode;
  return {
    profile,
    swarmMode,
    maxParallel: swarmMode === 'off' ? 1 : maxParallel,
    capability,
  };
}

function resolveMaxParallel(profile: ExecutionProfile, requestedParallel?: number): number {
  const sanitized = sanitizeParallel(requestedParallel);
  if (profile === 'safe') {
    return 1;
  }
  if (profile === 'balanced') {
    return Math.min(sanitized, 2);
  }
  return sanitized;
}

function sanitizeParallel(value?: number): number {
  if (typeof value !== 'number' || Number.isNaN(value) || !Number.isFinite(value)) {
    return 3;
  }
  const normalized = Math.floor(value);
  return normalized > 0 ? normalized : 1;
}
