import type { ChatMessage } from './chat-message.js';

export const STOPPED_TEXT = '(stopped at the step limit)';

/**
 * Drops tool calls nobody answered from the last assistant turn
 * (the loop stopped at its step limit): the API rejects a history with them.
 */
export function closeDanglingCalls(history: ChatMessage[]): ChatMessage[] {
  const last = history.at(-1);
  if (last?.role !== 'assistant' || !last.tool_calls) return history;
  return [...history.slice(0, -1), { role: 'assistant', content: last.content || STOPPED_TEXT }];
}
