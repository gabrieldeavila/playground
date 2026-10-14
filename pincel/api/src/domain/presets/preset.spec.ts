import { describe, expect, it } from 'vitest';
import { fontSpecOf, presetNameSchema, presetSchema } from './preset.js';

describe('presetSchema', () => {
  it('fills defaults for the optional parts', () => {
    const preset = presetSchema.parse({ name: 'story', description: 'd', instructions: 'i', canvas: { width: 1080, height: 1920 } });
    expect(preset).toMatchObject({ fonts: [], colors: {}, assets: {}, canvas: { background: '#ffffff' } });
  });

  it('only accepts slug names, so a name is always a safe file name', () => {
    expect(presetNameSchema.safeParse('ig-promo-post').success).toBe(true);
    for (const bad of ['../etc', 'Promo Post', 'a/b', '', '-x']) expect(presetNameSchema.safeParse(bad).success).toBe(false);
  });
});

describe('fontSpecOf', () => {
  it('reads a family name or a font file entry', () => {
    expect(fontSpecOf('Anton')).toEqual({ family: 'Anton', weights: ['400', '700'] });
    expect(fontSpecOf({ family: 'Brand', source: '~/brand.otf', weights: ['900'] })).toEqual({
      family: 'Brand',
      source: '~/brand.otf',
      weights: ['900'],
    });
  });
});
