import { describe, expect, it } from 'vitest';
import { coverageToGray } from './mask-alpha.js';
import { selectionOverlayPixels } from './selection-overlay.js';

describe('selectionOverlayPixels', () => {
  it('dims unselected pixels, leaves the inside clear and draws the edge opaque', () => {
    const coverage = new Uint8Array(9 * 9);
    for (let y = 2; y <= 6; y++) for (let x = 2; x <= 6; x++) coverage[y * 9 + x] = 255;
    const { data } = selectionOverlayPixels(coverageToGray(coverage, 9, 9));
    const alphaAt = (x: number, y: number) => data[(y * 9 + x) * 4 + 3];
    expect(alphaAt(0, 0)).toBeGreaterThan(100);
    expect(alphaAt(4, 4)).toBe(0);
    expect(alphaAt(2, 4)).toBe(255);
  });
});
