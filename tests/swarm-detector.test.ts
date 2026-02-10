import { describe, expect, it } from 'vitest';
import { resolveExecutionPolicy, resolveSwarmMode } from '../src/swarm/detector.js';

describe('swarm detector execution policy', () => {
  it('honors explicit swarm override over profile defaults', () => {
    const policy = resolveExecutionPolicy('claude', 'safe', {
      swarmOverride: 'native',
      requestedParallel: 5,
    });

    expect(policy.swarmMode).toBe('native');
  });

  it('forces conservative parallelism for safe and balanced profiles', () => {
    const safe = resolveExecutionPolicy('claude', 'safe', { requestedParallel: 9 });
    const balanced = resolveExecutionPolicy('claude', 'balanced', { requestedParallel: 9 });
    const fast = resolveExecutionPolicy('claude', 'fast', { requestedParallel: 9 });

    expect(safe.maxParallel).toBe(1);
    expect(balanced.maxParallel).toBe(2);
    expect(fast.maxParallel).toBe(9);
  });

  it('falls back to capability-based mode when no override is present', () => {
    const nativeCapable = resolveExecutionPolicy('claude', 'balanced');
    const processOnly = resolveExecutionPolicy('cursor', 'balanced');

    expect(nativeCapable.swarmMode).toBe('native');
    expect(processOnly.swarmMode).toBe('process');
  });

  it('keeps compatibility for resolveSwarmMode helper', () => {
    expect(resolveSwarmMode('claude')).toBe('native');
    expect(resolveSwarmMode('claude', 'off')).toBe('off');
  });
});
