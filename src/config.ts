import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parse } from 'yaml';
import type { OutputFormat } from './utils/logging.js';

export type RunConfig = {
  mode?: 'auto' | 'hybrid' | 'supervised';
  engine?: string;
  planningEngine?: string;
  maxParallel?: number;
  executionProfile?: 'safe' | 'balanced' | 'fast';
  audienceProfile?: 'solo-dev' | 'agency-team' | 'product-team' | 'enterprise-team';
  budget?: number;
  brownfield?: boolean;
  swarm?: 'native' | 'process' | 'off';
  createPr?: boolean;
  output?: OutputFormat;
  plugins?: string[];
  model?: string;
  agent?: string;
  timeout?: number;
  templates?: {
    productBrief?: string;
    prd?: string;
    architecture?: string;
    stories?: string;
  };
};

const FILE_CANDIDATES = ['.bemadralphyrc', 'bemad.config.json', 'bemad.config.js', 'bemad.config.mjs'];

export async function loadRunConfig(projectRoot: string): Promise<RunConfig> {
  for (const candidate of FILE_CANDIDATES) {
    const fullPath = path.join(projectRoot, candidate);
    if (!(await exists(fullPath))) {
      continue;
    }
    if (candidate.endsWith('.js') || candidate.endsWith('.mjs')) {
      return loadJsConfig(fullPath);
    }
    const raw = await readFile(fullPath, 'utf-8');
    return parseTextConfig(raw);
  }
  return {};
}

function parseTextConfig(contents: string): RunConfig {
  const trimmed = contents.trim();
  if (!trimmed) {
    return {};
  }
  if (trimmed.startsWith('{')) {
    return JSON.parse(trimmed) as RunConfig;
  }
  return (parse(trimmed) as RunConfig) ?? {};
}

async function loadJsConfig(fullPath: string): Promise<RunConfig> {
  const loaded = await import(pathToFileURL(fullPath).href);
  const exported = loaded.default ?? loaded.config ?? loaded;
  return (exported ?? {}) as RunConfig;
}

async function exists(targetPath: string): Promise<boolean> {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}
