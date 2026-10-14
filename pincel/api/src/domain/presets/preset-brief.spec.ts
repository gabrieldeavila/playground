import { describe, expect, it } from 'vitest';
import { presetBrief } from './preset-brief.js';
import { presetSchema } from './preset.js';

const preset = presetSchema.parse({
  name: 'promo-post',
  description: 'Square promo post',
  instructions: 'Product centered, price at the bottom.',
  canvas: { width: 1080, height: 1080 },
  colors: { primary: '#e63946' },
  assets: { logo: '~/brand/logo.png' },
});

describe('presetBrief', () => {
  it('tells the model the canvas, fonts, colors, assets and instructions', () => {
    const text = presetBrief({ preset, document: 'canvas', width: 1080, height: 1080, fonts: ['Anton'], warnings: [] });
    expect(text).toBe(
      [
        'Preset "promo-post" applied: Square promo post',
        'New 1080x1080 document.',
        'Fonts ready: "Anton"',
        'Colors: primary = #e63946',
        'Assets (bring in with place_image path, or open_image when it is the base photo): logo = ~/brand/logo.png',
        '',
        'Instructions:',
        'Product centered, price at the bottom.',
      ].join('\n'),
    );
  });

  it('skips empty sections and reports warnings', () => {
    const bare = presetSchema.parse({ name: 'bare', description: 'd', instructions: 'i' });
    const text = presetBrief({ preset: bare, document: 'unchanged', width: 800, height: 600, fonts: [], warnings: ['no font X'] });
    expect(text).toBe(
      ['Preset "bare" applied: d', 'The document was left as it was (800x600).', 'Warning: no font X', '', 'Instructions:', 'i'].join('\n'),
    );
  });

  it('mentions the template layers', () => {
    const text = presetBrief({ preset, document: 'template', width: 1080, height: 1920, fonts: [], warnings: [] });
    expect(text).toContain("the preset's template (1080x1920); call get_document");
  });
});
