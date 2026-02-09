import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { PipelineContext } from '../phases/types.js';
import { commandExists } from '../utils/exec.js';
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

  const hasBmad = await commandExists('bmad');
  if (hasBmad) {
    logInfo(
      `planning: BMAD CLI detected (planningEngine=${ctx.planningEngine ?? 'default'}). ` +
        'Automated invocation not implemented; using placeholders.',
    );
  } else {
    logInfo('planning: BMAD CLI not found; using placeholders');
  }

  await writeIfMissing(
    outputs.productBriefPath,
    placeholderDoc('Product Brief', ['Problem', 'Goals', 'Non-Goals', 'Users', 'Success Metrics']),
  );
  await writeIfMissing(
    outputs.prdPath,
    placeholderDoc('PRD', [
      'Overview',
      'User Stories',
      'Functional Requirements',
      'Non-Functional Requirements',
    ]),
  );
  await writeIfMissing(
    outputs.architecturePath,
    placeholderDoc('Architecture', [
      'System Overview',
      'Key Components',
      'Data Flows',
      'Decisions',
    ]),
  );
  await writeIfMissing(
    outputs.storiesPath,
    placeholderDoc('Epics and Stories', ['Epic 1', 'Epic 2', 'Epic 3']),
  );

  await validateBmadOutputs(outputs);
  logInfo('planning: placeholder BMAD outputs created');
}

async function writeIfMissing(pathname: string, contents: string): Promise<void> {
  try {
    await writeFile(pathname, contents, { flag: 'wx' });
  } catch {
    // File exists; do nothing.
  }
}

function placeholderDoc(title: string, sections: string[]): string {
  const lines = [`# ${title}`, '', 'This is a placeholder document.', ''];
  for (const section of sections) {
    lines.push(`## ${section}`, '', 'TBD', '');
  }
  return lines.join('\n');
}
