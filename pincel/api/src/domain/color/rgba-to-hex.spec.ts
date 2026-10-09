import { describe, expect, it } from 'vitest';
import { rgbaToHex } from './rgba-to-hex.js';

describe('rgbaToHex', () => {
  it('formats opaque colors as #rrggbb', () => {
    expect(rgbaToHex(255, 0, 16)).toBe('#ff0010');
  });

  it('appends alpha when not opaque and clamps values', () => {
    expect(rgbaToHex(300, -5, 0, 128)).toBe('#ff000080');
  });
});
