import { claudeAdapter } from './claude.js';
import { codexAdapter } from './codex.js';
import { copilotAdapter } from './copilot.js';
import { cursorAdapter } from './cursor.js';
import { geminiAdapter } from './gemini.js';
import { kimiAdapter } from './kimi.js';
import { ollamaAdapter } from './ollama.js';
import { opencodeAdapter } from './opencode.js';
import { qwenAdapter } from './qwen.js';
import type { EngineAdapter } from './types.js';

export const engineAdapters: Record<string, EngineAdapter> = {
  claude: claudeAdapter,
  codex: codexAdapter,
  copilot: copilotAdapter,
  cursor: cursorAdapter,
  gemini: geminiAdapter,
  kimi: kimiAdapter,
  ollama: ollamaAdapter,
  opencode: opencodeAdapter,
  qwen: qwenAdapter,
};
