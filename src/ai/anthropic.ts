import type { AIProvider, CompletionOptions } from './provider.js';
import { parseStructuredJson } from './provider.js';

type AnthropicMessageResponse = {
  content?: Array<{ type?: string; text?: string }>;
};

export class AnthropicProvider implements AIProvider {
  constructor(private readonly apiKey: string) {}

  async complete(prompt: string, options: CompletionOptions = {}): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: options.model ?? 'claude-3-5-sonnet-latest',
        max_tokens: options.maxTokens ?? 2_048,
        temperature: options.temperature ?? 0.2,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Anthropic API failed (${response.status}): ${body}`);
    }
    const parsed = (await response.json()) as AnthropicMessageResponse;
    const text = parsed.content?.find((entry) => entry.type === 'text')?.text?.trim();
    if (!text) {
      throw new Error('Anthropic API returned empty response content');
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
