import { describe, expect, it } from 'vitest';
import { agentApiFor } from './agent-api.js';

describe('agentApiFor', () => {
  it('uses the Responses API for OpenAI', () => {
    expect(agentApiFor('https://api.openai.com/v1')).toBe('responses');
  });

  it('uses chat completions for every other provider', () => {
    expect(agentApiFor('https://openrouter.ai/api/v1')).toBe('chat-completions');
    expect(agentApiFor('http://localhost:11434/v1')).toBe('chat-completions');
    expect(agentApiFor('not a url')).toBe('chat-completions');
  });
});
