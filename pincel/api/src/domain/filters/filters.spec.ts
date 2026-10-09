import { describe, expect, it } from 'vitest';
import { FILTERS } from './filter-catalog.js';
import type { PixelBuffer } from './pixel-buffer.js';

function solid(width: number, height: number, rgba: number[]): PixelBuffer {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i += 4) data.set(rgba, i);
  return { width, height, data };
}

const firstPixel = (b: PixelBuffer) => Array.from(b.data.slice(0, 4));

describe('color filters', () => {
  it('grayscale makes channels equal and keeps alpha', () => {
    const [r, g, b, a] = firstPixel(FILTERS.grayscale.apply(solid(1, 1, [200, 50, 10, 99]), 1));
    expect(r).toBe(g);
    expect(g).toBe(b);
    expect(a).toBe(99);
  });

  it('invert flips channels', () => {
    expect(firstPixel(FILTERS.invert.apply(solid(1, 1, [0, 100, 255, 255]), 1))).toEqual([255, 155, 0, 255]);
  });

  it('brightness shifts and clamps', () => {
    expect(firstPixel(FILTERS.brightness.apply(solid(1, 1, [250, 100, 0, 255]), 0.1))).toEqual([255, 126, 26, 255]);
  });

  it('contrast at 0 is a no-op', () => {
    expect(firstPixel(FILTERS.contrast.apply(solid(1, 1, [30, 128, 220, 255]), 0))).toEqual([30, 128, 220, 255]);
  });

  it('saturation -1 equals full grayscale', () => {
    const desat = firstPixel(FILTERS.saturation.apply(solid(1, 1, [200, 50, 10, 255]), -1));
    const gray = firstPixel(FILTERS.grayscale.apply(solid(1, 1, [200, 50, 10, 255]), 1));
    expect(desat).toEqual(gray);
  });

  it('hue_rotate 360 is (almost) identity', () => {
    const [r, g, b] = firstPixel(FILTERS.hue_rotate.apply(solid(1, 1, [200, 50, 10, 255]), 360));
    expect([r, g, b]).toEqual([200, 50, 10]);
  });

  it('threshold splits into black and white', () => {
    expect(firstPixel(FILTERS.threshold.apply(solid(1, 1, [240, 240, 240, 255]), 0.5)).slice(0, 3)).toEqual([255, 255, 255]);
    expect(firstPixel(FILTERS.threshold.apply(solid(1, 1, [20, 20, 20, 255]), 0.5)).slice(0, 3)).toEqual([0, 0, 0]);
  });

  it('posterize with 2 levels snaps to 0 or 255', () => {
    expect(firstPixel(FILTERS.posterize.apply(solid(1, 1, [100, 200, 30, 255]), 2)).slice(0, 3)).toEqual([0, 255, 0]);
  });
});

describe('spatial filters', () => {
  it('blur leaves a solid image unchanged', () => {
    expect(firstPixel(FILTERS.blur.apply(solid(5, 5, [10, 20, 30, 255]), 2))).toEqual([10, 20, 30, 255]);
  });

  it('blur spreads a single opaque pixel without darkening its color', () => {
    const buffer = solid(5, 1, [0, 0, 0, 0]);
    buffer.data.set([255, 0, 0, 255], 8);
    FILTERS.blur.apply(buffer, 1);
    expect(buffer.data[3]).toBeGreaterThan(0);
    expect(buffer.data[0]).toBe(255);
  });

  it('pixelate copies the block origin color', () => {
    const buffer = solid(2, 1, [0, 0, 0, 255]);
    buffer.data.set([9, 9, 9, 255], 0);
    expect(Array.from(FILTERS.pixelate.apply(buffer, 2).data.slice(4, 8))).toEqual([9, 9, 9, 255]);
  });

  it('sharpen leaves a flat area unchanged', () => {
    expect(firstPixel(FILTERS.sharpen.apply(solid(3, 3, [80, 80, 80, 255]), 1))).toEqual([80, 80, 80, 255]);
  });
});
