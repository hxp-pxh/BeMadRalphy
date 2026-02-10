import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export type TemplateName = 'product-brief' | 'prd' | 'architecture' | 'stories';

const DEFAULT_TEMPLATE_PATHS: Record<TemplateName, string> = {
  'product-brief': 'product-brief.prompt.md',
  prd: 'prd.prompt.md',
  architecture: 'architecture.prompt.md',
  stories: 'stories.prompt.md',
};

export type TemplateOverrides = Partial<
  Record<'productBrief' | 'prd' | 'architecture' | 'stories', string>
>;

export async function loadTemplate(
  projectRoot: string,
  name: TemplateName,
  overrides: TemplateOverrides = {},
): Promise<string> {
  const override = resolveOverride(name, overrides);
  if (override) {
    return readFile(path.resolve(projectRoot, override), 'utf-8');
  }
  const fullPath = path.join(path.dirname(fileURLToPath(import.meta.url)), DEFAULT_TEMPLATE_PATHS[name]);
  return readFile(fullPath, 'utf-8');
}

export function renderTemplate(template: string, variables: Record<string, string>): string {
  let output = template;
  for (const [key, value] of Object.entries(variables)) {
    output = output.replaceAll(`{{${key}}}`, value);
  }
  return output;
}

function resolveOverride(
  name: TemplateName,
  overrides: TemplateOverrides,
): string | undefined {
  if (name === 'product-brief') {
    return overrides.productBrief;
  }
  if (name === 'prd') {
    return overrides.prd;
  }
  if (name === 'architecture') {
    return overrides.architecture;
  }
  return overrides.stories;
}
