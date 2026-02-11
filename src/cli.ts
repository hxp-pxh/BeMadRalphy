#!/usr/bin/env node
import 'dotenv/config';
import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  runDoctor,
  runExecuteOnly,
  runExplore,
  runHistory,
  runInit,
  runPlanOnly,
  runPipeline,
  runReplay,
  runResume,
  runStatus,
} from './orchestrator.js';
import { TaskManager } from './tasks/index.js';

const program = new Command();

program
  .name('bemadralphy')
  .description('CLI orchestrator for end-to-end automated coding pipelines')
  .version(resolveCliVersion());

program
  .command('init')
  .description('Initialize BMAD, Beads, and BeMadRalphy config')
  .action(async () => {
    await runInit();
  });

program
  .command('run')
  .description('Run the full pipeline')
  .option('--mode <mode>', 'Autonomy mode: auto|hybrid|supervised')
  .option('--engine <name>', 'AI engine to use')
  .option('--planning-engine <name>', 'Override engine for planning phase only')
  .option('--model <name>', 'Model for direct planning calls')
  .option('--timeout <seconds>', 'Task timeout hint in seconds', (v) => Number(v))
  .option('--max-parallel <n>', 'Max parallel tasks', (v) => Number(v))
  .option(
    '--execution-profile <profile>',
    'Execution guardrails profile: safe|balanced|fast',
  )
  .option(
    '--audience-profile <profile>',
    'Target audience profile: solo-dev|agency-team|product-team|enterprise-team',
  )
  .option('--budget <usd>', 'Cost cap in USD', (v) => Number(v))
  .option('--brownfield', 'Force brownfield mode')
  .option('--swarm <mode>', 'Override swarm detection: native|process|off')
  .option('--create-pr', 'Create PRs per task')
  .option('--dry-run', 'Preview plan and estimated cost without execution')
  .option('--resume', 'Resume from latest checkpoint')
  .option('--from-phase <phase>', 'Start from a specific phase')
  .option('--output <format>', 'Output format: text|json', 'text')
  .option('--plugin <paths...>', 'Load plugin module(s) from path')
  .action(async (options, command) => {
    const resolved = resolveRunOptions(options, command);
    await runPipeline(resolved);
  });

program
  .command('plan')
  .description('Run intake + planning + steering phases')
  .option('--output <format>', 'Output format: text|json', 'text')
  .option('--model <name>', 'Model for direct planning calls')
  .action(async (options) => {
    await runPlanOnly({ output: options.output, model: options.model });
  });

program
  .command('execute')
  .description('Run sync + execute phases')
  .option('--output <format>', 'Output format: text|json', 'text')
  .option('--engine <name>', 'AI engine to use')
  .action(async (options) => {
    await runExecuteOnly({ output: options.output, engine: options.engine });
  });

program
  .command('resume')
  .description('Resume from latest checkpoint')
  .option('--from <phase>', 'Resume from a specific phase')
  .option('--output <format>', 'Output format: text|json', 'text')
  .action(async (options) => {
    await runResume({ fromPhase: options.from, output: options.output });
  });

const tasksCmd = program.command('tasks').description('Task manager commands');

tasksCmd
  .command('list')
  .description('List tasks from internal task database')
  .option('--status <status>', 'Filter by status')
  .action(async (options) => {
    const manager = await TaskManager.create(process.cwd());
    const tasks = options.status ? manager.getByStatus(options.status) : manager.getAll();
    for (const task of tasks) {
      console.log(`${task.id}\t${task.status}\t${task.title}`);
    }
  });

tasksCmd
  .command('show <id>')
  .description('Show a task by id')
  .action(async (id: string) => {
    const manager = await TaskManager.create(process.cwd());
    const task = manager.get(id);
    if (!task) {
      console.log(`Task not found: ${id}`);
      return;
    }
    console.log(JSON.stringify(task, null, 2));
  });

tasksCmd
  .command('retry <id>')
  .description('Retry a failed task')
  .action(async (id: string) => {
    const manager = await TaskManager.create(process.cwd());
    const task = manager.retry(id);
    console.log(`Task reset to open: ${task.id}`);
  });

program
  .command('config')
  .description('Config commands')
  .command('set <key> <value>')
  .description('Set key/value in .bemadralphyrc')
  .action(async (key: string, value: string) => {
    const fs = await import('node:fs/promises');
    const cfgPath = path.join(process.cwd(), '.bemadralphyrc');
    let current = {} as Record<string, unknown>;
    try {
      const raw = await fs.readFile(cfgPath, 'utf-8');
      current = JSON.parse(raw);
    } catch {
      current = {};
    }
    current[key] = value;
    await fs.writeFile(cfgPath, JSON.stringify(current, null, 2), 'utf-8');
    console.log(`Updated ${cfgPath}: ${key}=${value}`);
  });

program
  .command('explore <query>')
  .description('Investigate a codebase or domain before planning')
  .action(async (query: string) => {
    await runExplore(query);
  });

program
  .command('status')
  .description('Show pipeline status')
  .option('--output <format>', 'Output format: text|json', 'text')
  .action(async (options) => {
    await runStatus(options.output);
  });

program
  .command('history')
  .description('Show previous pipeline runs')
  .option('--output <format>', 'Output format: text|json', 'text')
  .action(async (options) => {
    await runHistory(options.output);
  });

program
  .command('doctor')
  .description('Check local environment dependencies and readiness')
  .option('--output <format>', 'Output format: text|json', 'text')
  .action(async (options) => {
    await runDoctor(options.output);
  });

program
  .command('replay <runId>')
  .description('Replay a previous run from history')
  .option('--from-phase <phase>', 'Replay from a specific phase')
  .option('--output <format>', 'Output format: text|json', 'text')
  .action(async (runId: string, options) => {
    await runReplay(runId, {
      fromPhase: options.fromPhase,
      output: options.output,
    });
  });

program.parse();

function resolveRunOptions(
  options: Record<string, unknown>,
  command: Command,
): Record<string, unknown> {
  return {
    mode: maybeOption(command, 'mode', options.mode),
    engine: maybeOption(command, 'engine', options.engine),
    planningEngine: maybeOption(command, 'planningEngine', options.planningEngine),
    model: maybeOption(command, 'model', options.model),
    timeout: maybeOption(command, 'timeout', options.timeout),
    maxParallel: maybeOption(command, 'maxParallel', options.maxParallel),
    executionProfile: maybeOption(command, 'executionProfile', options.executionProfile),
    audienceProfile: maybeOption(command, 'audienceProfile', options.audienceProfile),
    budget: maybeOption(command, 'budget', options.budget),
    brownfield: maybeOption(command, 'brownfield', options.brownfield),
    swarm: maybeOption(command, 'swarm', options.swarm),
    createPr: maybeOption(command, 'createPr', options.createPr),
    dryRun: maybeOption(command, 'dryRun', options.dryRun),
    resume: maybeOption(command, 'resume', options.resume),
    fromPhase: maybeOption(command, 'fromPhase', options.fromPhase),
    output: maybeOption(command, 'output', options.output),
    plugins: maybeOption(command, 'plugin', options.plugin),
  };
}

function maybeOption(command: Command, key: string, value: unknown): unknown {
  const source = command.getOptionValueSource(key);
  if (source === 'cli') {
    return value;
  }
  return undefined;
}

function resolveCliVersion(): string {
  try {
    const here = path.dirname(fileURLToPath(import.meta.url));
    const packageJsonPath = path.join(here, '..', 'package.json');
    const raw = readFileSync(packageJsonPath, 'utf-8');
    const parsed = JSON.parse(raw) as { version?: unknown };
    if (typeof parsed.version === 'string' && parsed.version.trim().length > 0) {
      return parsed.version;
    }
  } catch {
    // fall through to default
  }
  return '0.0.0';
}
