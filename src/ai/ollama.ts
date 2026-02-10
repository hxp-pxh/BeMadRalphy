import type { AIProvider, CompletionOptions } from './provider.js';
import { parseStructuredJson } from './provider.js';

type OllamaGenerateResponse = {
  response?: string;
};

export class OllamaProvider implements AIProvider {
  constructor(private readonly baseUrl: string = 'http://127.0.0.1:11434') {}

  async complete(prompt: string, options: CompletionOptions = {}): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: options.model ?? process.env.OLLAMA_MODEL ?? 'llama3.1',
        prompt,
        stream: false,
        options: {
          temperature: options.temperature ?? 0.2,
          num_predict: options.maxTokens ?? 2_048,
        },
      }),
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Ollama API failed (${response.status}): ${body}`);
    }
    const parsed = (await response.json()) as OllamaGenerateResponse;
    const text = parsed.response?.trim();
    if (!text) {
      throw new Error('Ollama returned empty response content');
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
