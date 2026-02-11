import type { AIProvider, CompletionOptions } from './provider.js';
import { parseStructuredJson } from './provider.js';

type OpenRouterMessageResponse = {
  choices?: Array<{ message?: { content?: string } }>;
};

export class OpenRouterProvider implements AIProvider {
  constructor(private readonly apiKey: string) {}

  async complete(prompt: string, options: CompletionOptions = {}): Promise<string> {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'authorization': `Bearer ${this.apiKey}`,
        'x-title': 'BeMadRalphy',
      },
      body: JSON.stringify({
        model: options.model ?? 'anthropic/claude-3.5-sonnet',
        max_tokens: options.maxTokens ?? 2_048,
        temperature: options.temperature ?? 0.2,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`OpenRouter API failed (${response.status}): ${body}`);
    }
    const parsed = (await response.json()) as OpenRouterMessageResponse;
    const text = parsed.choices?.[0]?.message?.content?.trim();
    if (!text) {
      throw new Error('OpenRouter API returned empty response content');
    }
    return text;
  }

  async structured<T>(prompt: string, options: CompletionOptions = {}): Promise<T> {
    const jsonPrompt = prompt + '\n\nReturn ONLY valid JSON. Do not include markdown fences.';
    const raw = await this.complete(jsonPrompt, options);
    return parseStructuredJson<T>(raw);
  }
}
