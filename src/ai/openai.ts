import type { AIProvider, CompletionOptions } from './provider.js';
import { parseStructuredJson } from './provider.js';

type OpenAiResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
};

export class OpenAiProvider implements AIProvider {
  constructor(private readonly apiKey: string) {}

  async complete(prompt: string, options: CompletionOptions = {}): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: options.model ?? 'gpt-4.1-mini',
        max_tokens: options.maxTokens ?? 2_048,
        temperature: options.temperature ?? 0.2,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`OpenAI API failed (${response.status}): ${body}`);
    }
    const parsed = (await response.json()) as OpenAiResponse;
    const text = parsed.choices?.[0]?.message?.content?.trim();
    if (!text) {
      throw new Error('OpenAI API returned empty response content');
    }
    return text;
  }

  async structured<T>(prompt: string, options: CompletionOptions = {}): Promise<T> {
    const raw = await this.complete(
      `${prompt}\n\nReturn ONLY valid JSON. Do not include markdown fences.`,
      options,
    );
    return parseStructuredJson<T>(raw);
  }
}
