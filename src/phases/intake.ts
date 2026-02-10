import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parse, stringify } from 'yaml';
import { logInfo } from '../utils/logging.js';
import type { AudienceProfile, IntakeData, PipelineContext } from './types.js';

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
  const normalizedDecisions = normalizeIntakeDecisions(frontmatter, ctx.audienceProfile);
  const audienceProfile = normalizedDecisions.audience_profile as AudienceProfile;
  const intakeData: IntakeData = {
    sourceFile: path.basename(sourceFile),
    frontmatter: normalizedDecisions,
    body,
    createdAt: new Date().toISOString(),
  };

  const intakeDir = path.join(projectRoot, '.bemadralphy');
  await mkdir(intakeDir, { recursive: true });
  const intakePath = path.join(intakeDir, 'intake.yaml');

  const intakeYaml = stringify({
    source_file: intakeData.sourceFile,
    created_at: intakeData.createdAt,
    decisions: normalizedDecisions,
    idea: intakeData.body.trim(),
  });

  await writeFile(intakePath, intakeYaml, 'utf-8');

  logInfo(`intake written to ${intakePath}`);
  return { ...ctx, intakePath, intake: intakeData, audienceProfile };
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

function normalizeIntakeDecisions(
  frontmatter: Record<string, unknown>,
  existingAudienceProfile?: AudienceProfile,
): Record<string, unknown> {
  const audienceProfile = existingAudienceProfile ?? inferAudienceProfile(frontmatter) ?? 'product-team';
  return {
    ...frontmatter,
    audience_profile: audienceProfile,
    team_size: normalizeTeamSize(frontmatter['team_size']),
    delivery_velocity: normalizeDeliveryVelocity(frontmatter['delivery_velocity']),
  };
}

function inferAudienceProfile(frontmatter: Record<string, unknown>): AudienceProfile | undefined {
  const candidates = [
    frontmatter['audience_profile'],
    frontmatter['audience'],
    frontmatter['icp'],
    frontmatter['target_audience'],
  ];
  for (const candidate of candidates) {
    const normalized = normalizeAudienceProfile(candidate);
    if (normalized) {
      return normalized;
    }
  }
  return undefined;
}

function normalizeAudienceProfile(value: unknown): AudienceProfile | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const lowered = value.trim().toLowerCase();
  if (['solo', 'solo-dev', 'indie', 'freelancer'].includes(lowered)) {
    return 'solo-dev';
  }
  if (['agency', 'agency-team', 'consultancy'].includes(lowered)) {
    return 'agency-team';
  }
  if (['enterprise', 'enterprise-team', 'large-team'].includes(lowered)) {
    return 'enterprise-team';
  }
  if (['product-team', 'product', 'startup', 'team'].includes(lowered)) {
    return 'product-team';
  }
  return undefined;
}

function normalizeTeamSize(value: unknown): string {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(Math.max(1, Math.floor(value)));
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }
  return '2-10';
}

function normalizeDeliveryVelocity(value: unknown): string {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }
  return '1-3 features/week';
}
