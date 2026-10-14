import { describe, expect, it } from 'vitest';
import { fontFamilyOf, googleFontsHref, keepChosenPreset } from './presets';

const presets = [{ name: 'promo-post', description: 'Promo', hasTemplate: false, hasPreview: false }];

describe('keepChosenPreset', () => {
  it('keeps a preset that still exists', () => {
    expect(keepChosenPreset('promo-post', presets)).toBe('promo-post');
  });

  it('falls back to no preset when it is gone', () => {
    expect(keepChosenPreset('old-story', presets)).toBe('');
    expect(keepChosenPreset('', presets)).toBe('');
  });
});

describe('fontFamilyOf', () => {
  it('reads a name or a font entry', () => {
    expect(fontFamilyOf('Anton')).toBe('Anton');
    expect(fontFamilyOf({ family: 'Montserrat', weights: ['700'] })).toBe('Montserrat');
  });
});

describe('googleFontsHref', () => {
  it('asks Google Fonts for every family that comes from there', () => {
    expect(googleFontsHref(['Playfair Display', { family: 'Montserrat', weights: ['500'] }])).toBe(
      'https://fonts.googleapis.com/css2?family=Playfair+Display&family=Montserrat&display=swap',
    );
  });

  it('skips font files and returns null when nothing is left', () => {
    expect(googleFontsHref([{ family: 'Brand', source: '~/brand.otf' }])).toBeNull();
    expect(googleFontsHref([])).toBeNull();
  });
});
