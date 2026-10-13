/** Mirrors GET /api/agent/settings: the key itself never reaches the browser. */
export interface AgentSettings {
  baseURL: string;
  model: string;
  hasApiKey: boolean;
  apiKeyHint: string;
  reasoningEffort: string;
}

export interface AgentSettingsUpdate {
  baseURL?: string;
  model?: string;
  /** Empty keeps the saved key. */
  apiKey?: string;
  reasoningEffort?: string;
}

/** Local servers (Ollama, LM Studio) run without a key; everyone else needs one before chatting. */
export function needsApiKey(settings: AgentSettings): boolean {
  return !settings.hasApiKey && !/^https?:\/\/(localhost|127\.0\.0\.1)[:/]/.test(settings.baseURL);
}

/** OpenAI-compatible endpoints with vision models. */
export const PROVIDER_PRESETS = [
  { label: 'OpenAI', baseURL: 'https://api.openai.com/v1', model: 'gpt-6.1-sol' },
  { label: 'OpenRouter', baseURL: 'https://openrouter.ai/api/v1', model: 'google/gemini-2.5-flash' },
  { label: 'Gemini', baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/', model: 'gemini-2.5-flash' },
  { label: 'Ollama (local)', baseURL: 'http://localhost:11434/v1', model: 'qwen2.5vl' },
];

/** "" = don't send it, the model's default. */
export const REASONING_EFFORTS = ['', 'none', 'low', 'medium', 'high', 'xhigh'];
