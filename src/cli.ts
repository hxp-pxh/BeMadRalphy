#!/usr/bin/env node
import { Command } from 'commander';
import { runExplore, runInit, runPipeline, runStatus } from './orchestrator.js';

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
  .option('--mode <mode>', 'Autonomy mode: auto|hybrid|supervised', 'hybrid')
  .option('--engine <name>', 'AI engine to use')
  .option('--planning-engine <name>', 'Override engine for planning phase only')
  .option('--max-parallel <n>', 'Max parallel tasks', (v) => Number(v), 3)
  .option(
    '--execution-profile <profile>',
    'Execution guardrails profile: safe|balanced|fast',
    'balanced',
  )
  .option(
    '--audience-profile <profile>',
    'Target audience profile: solo-dev|agency-team|product-team|enterprise-team',
  )
  .option('--budget <usd>', 'Cost cap in USD', (v) => Number(v))
  .option('--brownfield', 'Force brownfield mode', false)
  .option('--swarm <mode>', 'Override swarm detection: native|process|off')
  .option('--create-pr', 'Create PRs per task', false)
  .option('--dry-run', 'Plan only; do not execute', false)
  .action(async (options) => {
    await runPipeline(options);
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
  .action(async () => {
    await runStatus();
  });

program.parse();
