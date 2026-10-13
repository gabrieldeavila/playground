import { describe, expect, it } from 'vitest';
import type { ChatMessage } from './chat-message.js';
import { toResponsesInput, toResponsesTools } from './to-responses-input.js';

const call = { id: 'call_1', type: 'function' as const, function: { name: 'render_image', arguments: '{}' } };

describe('toResponsesInput', () => {
  it('moves system messages to instructions and maps the rest to input items', () => {
    const messages: ChatMessage[] = [
      { role: 'system', content: 'You edit images.' },
      { role: 'user', content: 'faz um sol' },
      { role: 'assistant', content: 'Vou olhar.', tool_calls: [call] },
      { role: 'tool', tool_call_id: 'call_1', content: 'Rendered' },
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Image from render_image:' },
          { type: 'image_url', image_url: { url: 'data:image/png;base64,AAA' } },
        ],
      },
    ];

    expect(toResponsesInput(messages)).toEqual({
      instructions: 'You edit images.',
      input: [
        { role: 'user', content: 'faz um sol' },
        { role: 'assistant', content: 'Vou olhar.' },
        { type: 'function_call', call_id: 'call_1', name: 'render_image', arguments: '{}' },
        { type: 'function_call_output', call_id: 'call_1', output: 'Rendered' },
        {
          role: 'user',
          content: [
            { type: 'input_text', text: 'Image from render_image:' },
            { type: 'input_image', image_url: 'data:image/png;base64,AAA', detail: 'auto' },
          ],
        },
      ],
    });
  });

  it('replays the provider output as is, reasoning included', () => {
    const providerOutput = [
      { type: 'reasoning', id: 'rs_1', summary: [], encrypted_content: 'xyz' },
      { type: 'function_call', id: 'fc_1', call_id: 'call_1', name: 'render_image', arguments: '{}' },
    ];
    const { input } = toResponsesInput([{ role: 'assistant', content: null, tool_calls: [call], providerOutput }]);
    expect(input).toEqual(providerOutput);
  });
});

describe('toResponsesTools', () => {
  it('flattens function tools', () => {
    const tools = toResponsesTools([
      { type: 'function', function: { name: 'undo', description: 'Undo', parameters: { type: 'object' } } },
    ]);
    expect(tools).toEqual([
      { type: 'function', name: 'undo', description: 'Undo', parameters: { type: 'object' }, strict: false },
    ]);
  });
});
