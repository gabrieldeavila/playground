export type AgentApi = 'responses' | 'chat-completions';

/**
 * OpenAI itself gets the Responses API: its newest models only reason and call tools together there.
 * Everyone else (Gemini, OpenRouter, Ollama, LM Studio) speaks chat completions.
 */
export function agentApiFor(baseURL: string): AgentApi {
  try {
    return new URL(baseURL).hostname === 'api.openai.com' ? 'responses' : 'chat-completions';
  } catch {
    return 'chat-completions';
  }
}
