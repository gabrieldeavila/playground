import type { ChatMessage, ContentPart } from './chat-message.js';

export interface ToolCallResult {
  callId: string;
  toolName: string;
  text: string;
  /** Base64 PNG the tool produced (render_image). */
  imagePng?: string;
}

/**
 * One `tool` message per call, then one `user` message carrying the images:
 * tool messages can't hold images, and all of them must directly follow the assistant turn.
 */
export function toolResultsToMessages(results: ToolCallResult[]): ChatMessage[] {
  const toolMessages: ChatMessage[] = results.map((result) => ({
    role: 'tool',
    tool_call_id: result.callId,
    content: result.imagePng ? `${result.text}\n(The image is attached in the next message.)` : result.text,
  }));
  const images = results.filter((result) => result.imagePng);
  if (images.length === 0) return toolMessages;
  return [...toolMessages, { role: 'user', content: images.flatMap(imageParts) }];
}

function imageParts(result: ToolCallResult): ContentPart[] {
  return [
    { type: 'text', text: `Image from ${result.toolName}:` },
    { type: 'image_url', image_url: { url: `data:image/png;base64,${result.imagePng}` } },
  ];
}
