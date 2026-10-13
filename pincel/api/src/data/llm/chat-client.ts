import type { ChatMessage, FunctionTool } from '../../domain/agent/chat-message.js';

export type AssistantMessage = Extract<ChatMessage, { role: 'assistant' }>;

/** One model call: the history and tools in, the model's next turn out. */
export interface ChatClient {
  complete(messages: ChatMessage[], tools: FunctionTool[], signal?: AbortSignal): Promise<AssistantMessage>;
}
