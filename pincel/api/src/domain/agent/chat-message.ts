/**
 * Chat messages in the OpenAI chat-completions wire format, which OpenAI-compatible
 * providers (Gemini, OpenRouter, Ollama) all accept. The OpenAI client translates
 * them to the Responses API (to-responses-input.ts).
 */

export interface ToolCall {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
}

export type ContentPart = { type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } };

export type ChatMessage =
  | { role: 'system'; content: string }
  | { role: 'user'; content: string | ContentPart[] }
  | {
      role: 'assistant';
      content: string | null;
      tool_calls?: ToolCall[];
      /** Responses API output items (reasoning included), replayed as is so the model keeps its train of thought. */
      providerOutput?: unknown[];
    }
  | { role: 'tool'; tool_call_id: string; content: string };

export interface FunctionTool {
  type: 'function';
  function: { name: string; description: string; parameters: Record<string, unknown> };
}
