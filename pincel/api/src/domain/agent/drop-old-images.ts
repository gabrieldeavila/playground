import type { ChatMessage, ContentPart } from './chat-message.js';

export const DROPPED_IMAGE_TEXT = '[older render removed to save context]';

/**
 * Keeps only the newest `keep` images in the history. Every render is a full PNG,
 * so old ones would blow up the context (and the bill) on long sessions.
 */
export function dropOldImages(messages: ChatMessage[], keep: number): ChatMessage[] {
  let remaining = keep;
  const newestFirst = [...messages].reverse().map((message) => {
    if (message.role !== 'user' || typeof message.content === 'string') return message;
    const parts = [...message.content].reverse().map((part) => {
      if (part.type !== 'image_url') return part;
      if (remaining > 0) {
        remaining -= 1;
        return part;
      }
      return { type: 'text', text: DROPPED_IMAGE_TEXT } satisfies ContentPart;
    });
    return { ...message, content: parts.reverse() };
  });
  return newestFirst.reverse();
}
