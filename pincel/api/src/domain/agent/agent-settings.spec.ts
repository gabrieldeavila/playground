import { describe, expect, it } from 'vitest';
import { DEFAULT_AGENT_SETTINGS, mergeSettings, missingSettings, toPublicSettings } from './agent-settings.js';

const saved = { baseURL: 'https://api.openai.com/v1', model: 'gpt-4.1', apiKey: 'sk-secret-1234', reasoningEffort: '' };

describe('agent settings', () => {
  it('never exposes the key, only a hint', () => {
    expect(toPublicSettings(saved)).toEqual({
      baseURL: saved.baseURL,
      model: 'gpt-4.1',
      hasApiKey: true,
      apiKeyHint: '…1234',
      reasoningEffort: '',
    });
  });

  it('keeps the saved key when the update leaves it empty', () => {
    expect(mergeSettings(saved, { model: 'gpt-4o', apiKey: '' })).toEqual({ ...saved, model: 'gpt-4o' });
  });

  it('sets and clears the reasoning effort', () => {
    const withEffort = mergeSettings(saved, { reasoningEffort: 'none' });
    expect(withEffort.reasoningEffort).toBe('none');
    expect(mergeSettings(withEffort, {}).reasoningEffort).toBe('none');
    expect(mergeSettings(withEffort, { reasoningEffort: '' }).reasoningEffort).toBe('');
  });

  it('requires a key for remote providers but not for local ones', () => {
    expect(missingSettings(DEFAULT_AGENT_SETTINGS)).toBe('Add an API key first.');
    expect(missingSettings({ ...DEFAULT_AGENT_SETTINGS, baseURL: 'http://localhost:11434/v1' })).toBeUndefined();
  });
});
