export type CompletionOptions = {
  model?: string;
  maxTokens?: number;
  temperature?: number;
};

export interface AIProvider {
  complete(prompt: string, options?: CompletionOptions): Promise<string>;
  structured<T>(prompt: string, options?: CompletionOptions): Promise<T>;
}

export function parseStructuredJson<T>(raw: string): T {
  const trimmed = raw.trim();
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced?.[1]) {
      return JSON.parse(fenced[1].trim()) as T;
    }
    throw new Error('AI provider returned non-JSON structured response');
  }
}
