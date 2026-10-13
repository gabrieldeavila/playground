/** Which OpenAI-compatible endpoint the built-in agent talks to. Vision models only. */
export interface AgentSettings {
  baseURL: string;
  model: string;
  apiKey: string;
  /** Sent as `reasoning_effort` when set (e.g. "none" for models that refuse tools while reasoning). */
  reasoningEffort: string;
}

/** What the editor may see: never the key itself. */
export interface PublicAgentSettings {
  baseURL: string;
  model: string;
  hasApiKey: boolean;
  apiKeyHint: string;
  reasoningEffort: string;
}

export const DEFAULT_AGENT_SETTINGS: AgentSettings = {
  baseURL: 'https://api.openai.com/v1',
  model: 'gpt-4.1',
  apiKey: '',
  reasoningEffort: '',
};

export function toPublicSettings(settings: AgentSettings): PublicAgentSettings {
  return {
    baseURL: settings.baseURL,
    model: settings.model,
    hasApiKey: settings.apiKey.length > 0,
    apiKeyHint: settings.apiKey.length > 8 ? `…${settings.apiKey.slice(-4)}` : '',
    reasoningEffort: settings.reasoningEffort,
  };
}

/** Applies an update; an empty or missing apiKey keeps the saved one. reasoningEffort "" clears it. */
export function mergeSettings(current: AgentSettings, update: Partial<AgentSettings>): AgentSettings {
  return {
    baseURL: update.baseURL?.trim() || current.baseURL,
    model: update.model?.trim() || current.model,
    apiKey: update.apiKey?.trim() || current.apiKey,
    reasoningEffort: update.reasoningEffort?.trim() ?? current.reasoningEffort,
  };
}

/** Local servers (Ollama, LM Studio) don't need a key. */
export function missingSettings(settings: AgentSettings): string | undefined {
  if (!settings.model) return 'Choose a model first.';
  if (!settings.apiKey && !isLocalUrl(settings.baseURL)) return 'Add an API key first.';
  return undefined;
}

function isLocalUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return hostname === 'localhost' || hostname === '127.0.0.1';
  } catch {
    return false;
  }
}
