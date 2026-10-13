import type { ChatMessage, FunctionTool } from '../../domain/agent/chat-message.js';
import type { ModelProgress } from '../../domain/agent/model-progress.js';

export type AssistantMessage = Extract<ChatMessage, { role: 'assistant' }>;

export interface CompleteOptions {
  signal?: AbortSignal;
  /** Called while the answer streams in, when the provider supports it. */
  onProgress?: (progress: ModelProgress) => void;
}

/** One model call: the history and tools in, the model's next turn out. */
export interface ChatClient {
  complete(messages: ChatMessage[], tools: FunctionTool[], options?: CompleteOptions): Promise<AssistantMessage>;
}
