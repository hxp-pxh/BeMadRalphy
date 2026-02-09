import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parse, stringify } from 'yaml';
import { logInfo } from '../utils/logging.js';
import type { IntakeData, PipelineContext } from './types.js';

export async function intakePhase(ctx: PipelineContext): Promise<PipelineContext> {
  logInfo('Phase 1 (intake): read idea.md and generate intake.yaml');

  const projectRoot = ctx.projectRoot;
  const ideaPath = path.join(projectRoot, 'idea.md');
  const planPath = path.join(projectRoot, 'plan.md');
  const sourceFile = await resolveIdeaFile(ideaPath, planPath);

  if (!sourceFile) {
    throw new Error('No idea.md or plan.md found in project root.');
  }

  const fileContents = await readFile(sourceFile, 'utf-8');
  const { frontmatter, body } = parseFrontmatter(fileContents);
  const intakeData: IntakeData = {
    sourceFile: path.basename(sourceFile),
    frontmatter,
    body,
    createdAt: new Date().toISOString(),
  };

  const intakeDir = path.join(projectRoot, '.bemadralphy');
  await mkdir(intakeDir, { recursive: true });
  const intakePath = path.join(intakeDir, 'intake.yaml');

  const intakeYaml = stringify({
    source_file: intakeData.sourceFile,
    created_at: intakeData.createdAt,
    decisions: intakeData.frontmatter,
    idea: intakeData.body.trim(),
  });

  await writeFile(intakePath, intakeYaml, 'utf-8');

  logInfo(`intake written to ${intakePath}`);
  return { ...ctx, intakePath, intake: intakeData };
}

async function resolveIdeaFile(ideaPath: string, planPath: string): Promise<string | null> {
  if (await exists(ideaPath)) {
    return ideaPath;
  }
  if (await exists(planPath)) {
    return planPath;
  }
  return null;
}

async function exists(targetPath: string): Promise<boolean> {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

function parseFrontmatter(contents: string): {
  frontmatter: Record<string, unknown>;
  body: string;
} {
  const lines = contents.split(/\r?\n/);
  if (lines[0] !== '---') {
    return { frontmatter: {}, body: contents };
  }

  const endIndex = lines.findIndex((line, idx) => idx > 0 && line === '---');
  if (endIndex === -1) {
    return { frontmatter: {}, body: contents };
  }

  const rawFrontmatter = lines.slice(1, endIndex).join('\n');
  const body = lines.slice(endIndex + 1).join('\n');
  const parsed = (parse(rawFrontmatter) ?? {}) as Record<string, unknown>;
  return { frontmatter: parsed, body };
}
