import { createCliAdapter } from './cli-adapter.js';

export const ollamaAdapter = createCliAdapter({
  name: 'ollama',
  commandName: 'ollama',
  hasNativeSwarm: false,
  buildArgs: (_task, prompt) => {
    const model = process.env.OLLAMA_MODEL?.trim() || 'llama3.2';
    return ['run', model, prompt];
  },
  unavailableHint: 'Install Ollama and run `ollama pull <model>`.',
  failureHint: 'Ensure the Ollama daemon is running and the selected model is available.',
});
