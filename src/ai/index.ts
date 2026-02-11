import { AnthropicProvider } from './anthropic.js';
import { OllamaProvider } from './ollama.js';
import { OpenAiProvider } from './openai.js';
import { OpenRouterProvider } from './openrouter.js';
import type { AIProvider, CompletionOptions } from './provider.js';

class FallbackProvider implements AIProvider {
  constructor(private readonly providers: AIProvider[]) {}

  async complete(prompt: string, options?: CompletionOptions): Promise<string> {
    let lastError: Error | undefined;
    for (const provider of this.providers) {
      try {
        return await provider.complete(prompt, options);
      } catch (error) {
        lastError = error as Error;
      }
    }
    throw lastError ?? new Error('No AI provider available');
  }

  async structured<T>(prompt: string, options?: CompletionOptions): Promise<T> {
    let lastError: Error | undefined;
    for (const provider of this.providers) {
      try {
        return await provider.structured<T>(prompt, options);
      } catch (error) {
        lastError = error as Error;
      }
    }
    throw lastError ?? new Error('No AI provider available');
  }
}

function getEnvKey(name: string): string | undefined {
  const raw = process.env[name];
  return typeof raw === 'string' ? raw.trim() || undefined : undefined;
}

export function createAIProvider(model?: string): AIProvider {
  const providers: AIProvider[] = [];
  
  // OpenRouter first (default) - supports free models and paid models
  const openrouterKey = getEnvKey('OPENROUTER_API_KEY');
  if (openrouterKey) {
    providers.push(new OpenRouterProvider(openrouterKey));
  }
  
  // Anthropic direct API (requires separate billing)
  const anthropicKey = getEnvKey('ANTHROPIC_API_KEY');
  if (anthropicKey) {
    providers.push(new AnthropicProvider(anthropicKey));
  }
  
  // OpenAI
  const openaiKey = getEnvKey('OPENAI_API_KEY');
  if (openaiKey) {
    providers.push(new OpenAiProvider(openaiKey));
  }
  
  // Ollama (local, always available as fallback)
  providers.push(new OllamaProvider());

  const fallback = new FallbackProvider(providers);
  if (!model) {
    return fallback;
  }
  return {
    complete: (prompt, options = {}) => fallback.complete(prompt, { ...options, model }),
    structured: <T>(prompt: string, options: CompletionOptions = {}) =>
      fallback.structured<T>(prompt, { ...options, model }),
  };
}

export type { AIProvider, CompletionOptions } from './provider.js';
