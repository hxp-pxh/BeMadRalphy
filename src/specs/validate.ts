import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import type { Dirent } from 'node:fs';

export async function validateSpecs(projectRoot: string): Promise<void> {
  await validateMainSpecs(projectRoot);
  await validateChangeSpecs(projectRoot);
}

async function validateMainSpecs(projectRoot: string): Promise<void> {
  const files = await collectSpecFiles(path.join(projectRoot, 'openspec', 'specs'));
  for (const file of files) {
    const content = await readFile(file, 'utf-8');
    assertHeader(content, '## Purpose', file);
    assertHeader(content, '## Requirements', file);
    assertRequirementStructure(content, file, false);
  }
}

async function validateChangeSpecs(projectRoot: string): Promise<void> {
  const changesRoot = path.join(projectRoot, 'openspec', 'changes');
  const changes = await safeReadDirNames(changesRoot);
  const files: string[] = [];
  for (const change of changes) {
    const specsDir = path.join(changesRoot, change, 'specs');
    const specFiles = await collectSpecFiles(specsDir);
    files.push(...specFiles);
  }
  for (const file of files) {
    const content = await readFile(file, 'utf-8');
    const hasDeltaSection =
      content.includes('## ADDED Requirements') ||
      content.includes('## MODIFIED Requirements') ||
      content.includes('## REMOVED Requirements') ||
      content.includes('## RENAMED Requirements');
    if (!hasDeltaSection) {
      throw new Error(`spec validation failed (${file}): missing delta section`);
    }
    assertRequirementStructure(content, file, true);
  }
}

async function collectSpecFiles(dir: string): Promise<string[]> {
  const entries = await safeReadDirEntries(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectSpecFiles(full)));
      continue;
    }
    if (entry.isFile() && entry.name === 'spec.md') {
      files.push(full);
    }
  }
  return files;
}

async function safeReadDirEntries(dir: string): Promise<Dirent[]> {
  try {
    return await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
}

async function safeReadDirNames(dir: string): Promise<string[]> {
  try {
    return await readdir(dir);
  } catch {
    return [];
  }
}

function assertHeader(content: string, header: string, file: string): void {
  if (!content.includes(header)) {
    throw new Error(`spec validation failed (${file}): missing ${header}`);
  }
}

function assertRequirementStructure(content: string, file: string, isDelta: boolean): void {
  const requirementMatches = Array.from(content.matchAll(/^### Requirement:\s+.+$/gm));
  if (!isDelta && requirementMatches.length === 0) {
    throw new Error(`spec validation failed (${file}): no requirements`);
  }
  for (const match of requirementMatches) {
    const start = match.index ?? 0;
    const slice = content.slice(start, start + 600);
    if (!isDelta && !/\b(SHALL|MUST)\b/.test(slice)) {
      throw new Error(`spec validation failed (${file}): requirement missing SHALL/MUST`);
    }
    if (!/#### Scenario:\s+.+/m.test(slice)) {
      throw new Error(`spec validation failed (${file}): requirement missing scenario`);
    }
    if (!/\bGIVEN\b/.test(slice) || !/\bWHEN\b/.test(slice) || !/\bTHEN\b/.test(slice)) {
      throw new Error(`spec validation failed (${file}): scenario missing GIVEN/WHEN/THEN`);
    }
  }
}
