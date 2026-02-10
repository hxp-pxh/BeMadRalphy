#!/usr/bin/env node
import { Command } from 'commander';
import { runExplore, runHistory, runInit, runPipeline, runReplay, runStatus } from './orchestrator.js';

const program = new Command();

program
  .name('bemadralphy')
  .description('CLI orchestrator for end-to-end automated coding pipelines')
  .version('0.1.0');

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
