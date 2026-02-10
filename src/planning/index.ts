import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createAIProvider } from '../ai/index.js';
import { loadRunConfig } from '../config.js';
import type { PipelineContext } from '../phases/types.js';
import { loadTemplate, renderTemplate } from '../templates/index.js';
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
    logInfo('planning: dry-run, skipping AI planning invocation');
    return;
  }

  try {
    await runPlanningViaAi(ctx, outputs);
  } catch (error) {
    logInfo(
      `planning: direct AI generation failed, writing fallback artifacts (${(error as Error).message})`,
    );
    await writeFallbackPlanningOutputs(
      ctx.projectRoot,
      outputs,
      'AI planning generation failed. Replace with validated planning outputs.',
    );
  }
  await validateBmadOutputs(outputs);
  logInfo('planning: BMAD outputs validated');
}

async function runPlanningViaAi(
  ctx: PipelineContext,
  outputs: {
    productBriefPath: string;
    prdPath: string;
    architecturePath: string;
    storiesPath: string;
  },
): Promise<void> {
  const config = await loadRunConfig(ctx.projectRoot);
  const idea = await readIdea(ctx.projectRoot);
  const provider = createAIProvider(config.model);

  const briefPrompt = renderTemplate(
    await loadTemplate(ctx.projectRoot, 'product-brief', config.templates),
    {
      idea,
      constraints: serializeArray(extractBulletSection(idea, 'Constraints')),
      audienceProfile: ctx.audienceProfile ?? 'solo-dev',
    },
  );
  const brief = await provider.complete(briefPrompt, { model: config.model });
  await writeFile(outputs.productBriefPath, brief, 'utf-8');

  const prdPrompt = renderTemplate(await loadTemplate(ctx.projectRoot, 'prd', config.templates), {
    productBrief: brief,
    projectName: path.basename(ctx.projectRoot),
  });
  const prd = await provider.complete(prdPrompt, { model: config.model });
  await writeFile(outputs.prdPath, prd, 'utf-8');

  const architecturePrompt = renderTemplate(
    await loadTemplate(ctx.projectRoot, 'architecture', config.templates),
    {
      prd,
      techStack: serializeArray(extractBulletSection(idea, 'Tech Stack')),
    },
  );
  const architecture = await provider.complete(architecturePrompt, { model: config.model });
  await writeFile(outputs.architecturePath, architecture, 'utf-8');

  const storiesPrompt = renderTemplate(
    await loadTemplate(ctx.projectRoot, 'stories', config.templates),
    {
      prd,
      architecture,
    },
  );
  const stories = await provider.complete(storiesPrompt, { model: config.model });
  await writeFile(outputs.storiesPath, stories, 'utf-8');

  logInfo('planning: planning artifacts generated via direct AI provider');
}

async function writeFallbackPlanningOutputs(
  projectRoot: string,
  outputs: {
    productBriefPath: string;
    prdPath: string;
    architecturePath: string;
    storiesPath: string;
  },
  reason: string,
): Promise<void> {
  const idea = await readIdea(projectRoot);
  await Promise.all([
    writeFile(
      outputs.productBriefPath,
      ['# Product Brief', '', `> Generated fallback: ${reason}`, '', idea].join('\n'),
      'utf-8',
    ),
    writeFile(
      outputs.prdPath,
      ['# PRD', '', `> Generated fallback: ${reason}`, '', idea].join('\n'),
      'utf-8',
    ),
    writeFile(
      outputs.architecturePath,
      [
        '# Architecture',
        '',
        `> Generated fallback: ${reason}`,
        '',
        '## Initial Constraints',
        '- Refine architecture after BMAD becomes available.',
      ].join('\n'),
      'utf-8',
    ),
    writeFile(
      outputs.storiesPath,
      ['# Epics', '', '## Epic 1: Bootstrap', '### Story 1.1: Replace fallback planning outputs with BMAD outputs.'].join(
        '\n',
      ),
      'utf-8',
    ),
  ]);
}

async function readIdea(projectRoot: string): Promise<string> {
  try {
    const raw = await readFile(path.join(projectRoot, 'idea.md'), 'utf-8');
    const trimmed = raw.trim();
    return trimmed.length > 0 ? trimmed : 'No idea.md content found.';
  } catch {
    return 'No idea.md found.';
  }
}

function extractBulletSection(markdown: string, sectionName: string): string[] {
  const lines = markdown.split(/\r?\n/);
  const startIndex = lines.findIndex((line) =>
    line.trim().toLowerCase().startsWith(`## ${sectionName.toLowerCase()}`),
  );
  if (startIndex < 0) {
    return [];
  }
  const values: string[] = [];
  for (let idx = startIndex + 1; idx < lines.length; idx += 1) {
    const line = lines[idx].trim();
    if (line.startsWith('## ')) {
      break;
    }
    if (line.startsWith('- ')) {
      values.push(line.slice(2).trim());
    }
  }
  return values;
}

function serializeArray(values: string[]): string {
  if (values.length === 0) {
    return 'None provided';
  }
  return values.map((value) => `- ${value}`).join('\n');
}
