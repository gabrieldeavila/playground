import type { ChatMessage } from './chat-message.js';

/** Chat-completions providers reject unknown fields, and Responses API items mean nothing to them. */
export function stripProviderOutput(messages: ChatMessage[]): ChatMessage[] {
  return messages.map((message) => {
    if (message.role !== 'assistant' || !message.providerOutput) return message;
    const { providerOutput: _dropped, ...rest } = message;
    return rest;
  });
}
