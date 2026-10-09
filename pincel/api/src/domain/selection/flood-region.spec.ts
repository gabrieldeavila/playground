import { describe, expect, it } from 'vitest';
import { floodRegion } from './flood-region.js';

/** 4x1 strip: red, red, blue, red */
function strip() {
  const data = new Uint8ClampedArray([255, 0, 0, 255, 250, 0, 0, 255, 0, 0, 255, 255, 255, 0, 0, 255]);
  return { width: 4, height: 1, data };
}

describe('floodRegion', () => {
  it('spreads through similar neighbours only', () => {
    expect(Array.from(floodRegion(strip(), 0, 0, 10, true))).toEqual([255, 255, 0, 0]);
  });

  it('selects every similar pixel when not contiguous', () => {
    expect(Array.from(floodRegion(strip(), 0, 0, 10, false))).toEqual([255, 255, 0, 255]);
  });

  it('respects tolerance', () => {
    expect(Array.from(floodRegion(strip(), 0, 0, 0, true))).toEqual([255, 0, 0, 0]);
  });

  it('does not wrap across row edges', () => {
    const data = new Uint8ClampedArray(2 * 2 * 4).fill(255);
    data.set([0, 0, 0, 255], 4); // (1,0) black
    data.set([0, 0, 0, 255], 8); // (0,1) black
    expect(Array.from(floodRegion({ width: 2, height: 2, data }, 0, 0, 0, true))).toEqual([255, 0, 0, 0]);
  });

  it('returns an empty region for a point outside the image', () => {
    expect(Array.from(floodRegion(strip(), -1, 0, 10, true))).toEqual([0, 0, 0, 0]);
  });
});
