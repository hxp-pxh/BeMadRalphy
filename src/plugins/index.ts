import { access } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { engineAdapters } from '../engines/index.js';
import type { PipelineContext } from '../phases/types.js';
import type { BemadPlugin, PhaseHook, PhaseName, PluginApi } from './types.js';

type HookRegistry = Record<PhaseName, PhaseHook[]>;

function createHookRegistry(): HookRegistry {
  return {
    intake: [],
    planning: [],
    steering: [],
    scaffold: [],
    sync: [],
    execute: [],
    verify: [],
    post: [],
  };
}

export type PluginRuntime = {
  beforeHooks: HookRegistry;
  afterHooks: HookRegistry;
};

export async function loadPlugins(projectRoot: string, pluginEntries: string[]): Promise<PluginRuntime> {
  const beforeHooks = createHookRegistry();
  const afterHooks = createHookRegistry();
  const api: PluginApi = {
    registerEngine(name, adapter) {
      engineAdapters[name] = adapter;
    },
    onBeforePhase(phase, hook) {
      beforeHooks[phase].push(hook);
    },
    onAfterPhase(phase, hook) {
      afterHooks[phase].push(hook);
    },
  };

  for (const entry of pluginEntries) {
    const pluginPath = path.isAbsolute(entry) ? entry : path.join(projectRoot, entry);
    if (!(await exists(pluginPath))) {
      continue;
    }
    const loaded = await import(pathToFileURL(pluginPath).href);
    const plugin = (loaded.default ?? loaded.plugin ?? loaded) as BemadPlugin;
    if (!plugin || typeof plugin.register !== 'function') {
      continue;
    }
    await plugin.register(api);
  }

  return { beforeHooks, afterHooks };
}

export async function runPhaseHooks(
  hooks: HookRegistry,
  phase: PhaseName,
  context: PipelineContext,
): Promise<void> {
  for (const hook of hooks[phase]) {
    await hook(context);
  }
}

async function exists(targetPath: string): Promise<boolean> {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}
