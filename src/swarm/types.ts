export type SwarmMode = 'native' | 'process' | 'off';
export type ExecutionProfile = 'safe' | 'balanced' | 'fast';

export type SwarmCapability = {
  supportsNative: boolean;
  reason?: string;
};

export type ExecutionPolicy = {
  profile: ExecutionProfile;
  swarmMode: SwarmMode;
  maxParallel: number;
  capability: SwarmCapability;
};
