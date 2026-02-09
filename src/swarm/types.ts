export type SwarmMode = 'native' | 'process' | 'off';

export type SwarmCapability = {
  supportsNative: boolean;
  reason?: string;
};
