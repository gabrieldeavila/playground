import { describe, expect, it } from 'vitest';
import { keepChosenPreset } from './presets';

const presets = [{ name: 'promo-post', description: 'Promo', hasTemplate: false }];

describe('keepChosenPreset', () => {
  it('keeps a preset that still exists', () => {
    expect(keepChosenPreset('promo-post', presets)).toBe('promo-post');
  });

  it('falls back to no preset when it is gone', () => {
    expect(keepChosenPreset('old-story', presets)).toBe('');
    expect(keepChosenPreset('', presets)).toBe('');
  });
});
