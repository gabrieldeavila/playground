import { describe, expect, it } from 'vitest';
import { alphaCoverage, coverageToGray, luminanceToAlpha } from './mask-alpha.js';

describe('mask conversions', () => {
  it('turns gray levels into alpha, treating transparent as hidden', () => {
    const data = new Uint8ClampedArray([255, 255, 255, 255, 0, 0, 0, 255, 128, 128, 128, 255, 255, 255, 255, 0]);
    const alphas = Array.from(luminanceToAlpha({ width: 4, height: 1, data }).data.filter((_, i) => i % 4 === 3));
    expect(alphas).toEqual([255, 0, 128, 0]);
  });

  it('round-trips coverage through a gray image', () => {
    const gray = coverageToGray([0, 200], 2, 1);
    expect(Array.from(gray.data)).toEqual([0, 0, 0, 255, 200, 200, 200, 255]);
    expect(Array.from(alphaCoverage({ width: 1, height: 1, data: new Uint8ClampedArray([9, 9, 9, 77]) }))).toEqual([77]);
  });
});
