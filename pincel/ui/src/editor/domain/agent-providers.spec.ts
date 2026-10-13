import { describe, expect, it } from 'vitest';
import { needsApiKey } from './agent-providers';

const base = { model: 'm', apiKeyHint: '', reasoningEffort: '' };

describe('needsApiKey', () => {
  it('asks for a key for remote providers until one is saved', () => {
    expect(needsApiKey({ ...base, baseURL: 'https://api.openai.com/v1', hasApiKey: false })).toBe(true);
    expect(needsApiKey({ ...base, baseURL: 'https://api.openai.com/v1', hasApiKey: true })).toBe(false);
  });

  it('lets local servers run without a key', () => {
    expect(needsApiKey({ ...base, baseURL: 'http://localhost:11434/v1', hasApiKey: false })).toBe(false);
  });
});
