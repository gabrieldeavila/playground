import { describe, expect, it } from 'vitest';
import { toolResultsToMessages } from './tool-results-to-messages.js';

describe('toolResultsToMessages', () => {
  it('answers each call with a tool message', () => {
    expect(toolResultsToMessages([{ callId: 'a', toolName: 'add_layer', text: 'Added layer 2' }])).toEqual([
      { role: 'tool', tool_call_id: 'a', content: 'Added layer 2' },
    ]);
  });

  it('puts images in one user message after all the tool messages', () => {
    const messages = toolResultsToMessages([
      { callId: 'a', toolName: 'render_image', text: 'Rendered 800x600', imagePng: 'AAA' },
      { callId: 'b', toolName: 'get_document', text: '{}' },
    ]);

    expect(messages.map((message) => message.role)).toEqual(['tool', 'tool', 'user']);
    expect(messages[2]).toEqual({
      role: 'user',
      content: [
        { type: 'text', text: 'Image from render_image:' },
        { type: 'image_url', image_url: { url: 'data:image/png;base64,AAA' } },
      ],
    });
  });
});
