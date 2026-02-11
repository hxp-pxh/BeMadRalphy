import { copyFileSync, existsSync, writeFileSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { logInfo } from '../utils/logging.js';
import { assertCommandExists, runCommand, runCommandSafe } from '../utils/exec.js';
import { TaskManager } from '../tasks/index.js';

export async function runClaudeTeamsBatch(projectRoot: string, maxParallel: number): Promise<void> {
  logInfo(`swarm: running Claude teams batch (maxParallel=${maxParallel})`);
  
  // Get task count from database to calculate iterations
  const manager = await TaskManager.create(projectRoot);
  const tasks = manager.getAll();
  const taskCount = tasks.length;
  
  if (taskCount === 0) {
    logInfo('swarm: no tasks found, skipping execution');
    return;
  }
  
  // Generate ralphy-compatible PRD.md with checkbox tasks
  const prdPath = path.join(projectRoot, 'PRD.md');
  const prdContent = generateRalphyPrd(tasks);
  writeFileSync(prdPath, prdContent, 'utf-8');
  logInfo(`swarm: generated PRD.md with ${taskCount} checkbox tasks`);
  
  // Ensure initial commit exists for ralphy parallel mode
  await ensureInitialCommit(projectRoot);
  
  await assertCommandExists('ralphy', 'Install with: npm install -g ralphy-cli');
  
  // Calculate iterations: at least taskCount/maxParallel rounds, plus buffer
  const iterations = Math.max(10, Math.ceil(taskCount / maxParallel) * 2);
  logInfo(`swarm: running ralphy with ${iterations} max iterations for ${taskCount} tasks`);
  
  await runCommand(
    'ralphy',
    ['--claude', '--parallel', '--max-parallel', String(maxParallel), '--max-iterations', String(iterations)],
    projectRoot,
  );
}

async function ensureInitialCommit(projectRoot: string): Promise<void> {
  // Check if there are any commits
  const result = await runCommandSafe('git', ['rev-parse', 'HEAD'], projectRoot);
  if (result.code === 0) {
    return; // Already has commits
  }
  
  logInfo('swarm: creating initial commit for ralphy parallel mode');
  await runCommandSafe('git', ['add', '-A'], projectRoot);
  await runCommand('git', ['commit', '-m', 'Initial commit from BeMadRalphy'], projectRoot);
}

function generateRalphyPrd(tasks: Array<{ id: string; title: string; description: string; status: string }>): string {
  const lines = [
    '# Project Tasks',
    '',
    'Complete the following tasks in order:',
    '',
  ];
  
  for (const task of tasks) {
    const checkbox = task.status === 'done' ? '[x]' : '[ ]';
    lines.push(`- ${checkbox} **${task.title}**`);
    
    // Add description as sub-items if it has content
    if (task.description && task.description !== 'No implementation steps provided.') {
      const descLines = task.description.split('\n').filter(l => l.trim());
      for (const line of descLines) {
        lines.push(`  ${line}`);
      }
    }
    lines.push('');
  }
  
  return lines.join('\n');
}
