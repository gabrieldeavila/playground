import { describe, expect, it } from 'vitest';
import type { ToolCall } from './chat-message.js';
import { nextAgentAction } from './next-agent-action.js';

const call: ToolCall = { id: 'c1', type: 'function', function: { name: 'get_document', arguments: '{}' } };

describe('nextAgentAction', () => {
  it('runs the tools the model asked for', () => {
    expect(nextAgentAction({ role: 'assistant', content: null, tool_calls: [call] }, 1, 10)).toEqual({
      kind: 'run-tools',
      calls: [call],
    });
  });

  it('is done when the model answers without tools', () => {
    expect(nextAgentAction({ role: 'assistant', content: 'Pronto!' }, 3, 10)).toEqual({ kind: 'done', text: 'Pronto!' });
  });

  it('stops at the step limit even if the model wants more tools', () => {
    expect(nextAgentAction({ role: 'assistant', content: null, tool_calls: [call] }, 10, 10)).toEqual({
      kind: 'step-limit',
      text: '',
    });
  });
});
