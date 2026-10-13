import { describe, expect, it } from 'vitest';
import type { ChatMessage } from './chat-message.js';
import { closeDanglingCalls, STOPPED_TEXT } from './close-dangling-calls.js';

describe('closeDanglingCalls', () => {
  it('turns unanswered tool calls into a plain assistant message', () => {
    const history: ChatMessage[] = [
      { role: 'user', content: 'oi' },
      { role: 'assistant', content: null, tool_calls: [{ id: 'a', type: 'function', function: { name: 'undo', arguments: '{}' } }] },
    ];
    expect(closeDanglingCalls(history)).toEqual([
      { role: 'user', content: 'oi' },
      { role: 'assistant', content: STOPPED_TEXT },
    ]);
  });

  it('keeps a finished history as is', () => {
    const history: ChatMessage[] = [{ role: 'assistant', content: 'Pronto' }];
    expect(closeDanglingCalls(history)).toBe(history);
  });
});
