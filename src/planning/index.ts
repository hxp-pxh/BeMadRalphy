import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { PipelineContext } from '../phases/types.js';
import { logInfo } from '../utils/logging.js';
import { validateBmadOutputs } from './validate.js';

export async function runPlanning(ctx: PipelineContext): Promise<void> {
  const outputDir = path.join(ctx.projectRoot, '_bmad-output');
  const storiesDir = path.join(outputDir, 'stories');
  await mkdir(storiesDir, { recursive: true });

  const outputs = {
    productBriefPath: path.join(outputDir, 'product-brief.md'),
    prdPath: path.join(outputDir, 'prd.md'),
    architecturePath: path.join(outputDir, 'architecture.md'),
    storiesPath: path.join(storiesDir, 'epics.md'),
  };

  if (ctx.dryRun) {
    logInfo('planning: dry-run, skipping BMAD invocation');
    return;
  }

  logInfo(
    `planning: using placeholder BMAD output (planningEngine=${ctx.planningEngine ?? 'default'})`,
  );

  const maxRetries = 2;
  for (let attempt = 1; attempt <= maxRetries + 1; attempt += 1) {
    await writeOutputs(outputs, attempt);
    try {
      await validateBmadOutputs(outputs);
      logInfo('planning: placeholder BMAD outputs created');
      return;
    } catch (error) {
      logInfo(`planning: validation failed (attempt ${attempt})`);
      if (attempt > maxRetries) {
        throw error;
      }
    }
  }
}

async function writeOutputs(
  outputs: {
    productBriefPath: string;
    prdPath: string;
    architecturePath: string;
    storiesPath: string;
  },
  attempt: number,
): Promise<void> {
  await writeFile(
    outputs.productBriefPath,
    placeholderDoc('Product Brief', [
      'Problem',
      'Goals',
      'Non-Goals',
      'Users',
      'Success Metrics',
      `Retry Attempt: ${attempt}`,
    ]),
    'utf-8',
  );
  await writeFile(
    outputs.prdPath,
    placeholderDoc('PRD', [
      'Overview',
      'User Stories',
      'Functional Requirements',
      'Non-Functional Requirements',
      `Retry Attempt: ${attempt}`,
    ]),
    'utf-8',
  );
  await writeFile(
    outputs.architecturePath,
    placeholderDoc('Architecture', [
      'System Overview',
      'Key Components',
      'Data Flows',
      'Decisions',
      `Retry Attempt: ${attempt}`,
    ]),
    'utf-8',
  );
  await writeFile(
    outputs.storiesPath,
    placeholderDoc('Epics and Stories', [
      'Epic 1',
      'Epic 2',
      'Epic 3',
      `Retry Attempt: ${attempt}`,
    ]),
    'utf-8',
  );
}

function placeholderDoc(title: string, sections: string[]): string {
  const lines = [`# ${title}`, '', 'This is a placeholder document.', ''];
  for (const section of sections) {
    lines.push(`## ${section}`, '', 'TBD', '');
  }
  return lines.join('\n');
}
