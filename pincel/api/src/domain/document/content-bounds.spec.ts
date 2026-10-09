import { describe, expect, it } from 'vitest';
import { contentBounds } from './content-bounds.js';

function buffer(width: number, height: number, opaque: [number, number][]) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (const [x, y] of opaque) data[(y * width + x) * 4 + 3] = 255;
  return { width, height, data };
}

describe('contentBounds', () => {
  it('returns null for a fully transparent layer', () => {
    expect(contentBounds(buffer(4, 4, []))).toBeNull();
  });

  it('wraps every visible pixel', () => {
    expect(contentBounds(buffer(10, 10, [[2, 3], [7, 5], [4, 8]]))).toEqual({ x: 2, y: 3, width: 6, height: 6 });
  });

  it('handles a single pixel in a corner', () => {
    expect(contentBounds(buffer(5, 5, [[4, 4]]))).toEqual({ x: 4, y: 4, width: 1, height: 1 });
  });
});
