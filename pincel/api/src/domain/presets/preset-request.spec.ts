import { describe, expect, it } from 'vitest';
import { withPreset } from './preset-request.js';

describe('withPreset', () => {
  it('leaves the message alone without a preset', () => {
    expect(withPreset('make a poster')).toBe('make a poster');
  });

  it('asks the model to apply the preset first', () => {
    expect(withPreset('~/shoe.jpg, R$ 199', 'promo-post')).toBe(
      'Use the preset "promo-post": call apply_preset first, then follow its instructions.\n\n~/shoe.jpg, R$ 199',
    );
  });
});
