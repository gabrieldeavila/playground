import { describe, expect, it } from 'vitest';
import type { PixelBuffer } from '../filters/pixel-buffer.js';
import { findSpots } from './find-spots.js';
import { healSpot } from './heal-spot.js';

/** Skin-colored image with a soft left→right brightness ramp and red spots. */
function skin(width: number, height: number, spots: [number, number, number][]): PixelBuffer {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const ramp = (x / width) * 20;
      data.set([220 + ramp * 0.5, 180 + ramp, 160 + ramp, 255], i);
      for (const [sx, sy, r] of spots) {
        if (Math.hypot(x - sx, y - sy) <= r) data.set([200, 90, 90, 255], i);
      }
    }
  }
  return { width, height, data };
}

const pixel = (b: PixelBuffer, x: number, y: number) => Array.from(b.data.slice((y * b.width + x) * 4, (y * b.width + x) * 4 + 3));

describe('findSpots', () => {
  it('finds small red blemishes with their size and ignores big red areas', () => {
    const buffer = skin(120, 80, [[30, 30, 3], [80, 50, 4], [100, 15, 25]]);
    const spots = findSpots(buffer, { threshold: 20, maxRadius: 10, minRadius: 1 });
    expect(spots).toHaveLength(2);
    const centers = spots.map((s) => s.center.map(Math.round));
    expect(centers).toContainEqual([30, 30]);
    expect(centers).toContainEqual([80, 50]);
    expect(spots.every((s) => s.radius >= 4)).toBe(true);
  });

  it('can be limited to a region or by a predicate', () => {
    const buffer = skin(120, 80, [[30, 30, 3], [80, 50, 4]]);
    expect(findSpots(buffer, { threshold: 20, maxRadius: 10, minRadius: 1, region: { x: 0, y: 0, width: 60, height: 80 } })).toHaveLength(1);
    expect(findSpots(buffer, { threshold: 20, maxRadius: 10, minRadius: 1, allowed: (x) => x > 60 })).toHaveLength(1);
  });
});

describe('healSpot', () => {
  it('replaces the blemish with skin that matches its surroundings', () => {
    const buffer = skin(120, 80, [[60, 40, 4]]);
    const surrounding = pixel(skin(120, 80, []), 60, 40);
    expect(healSpot(buffer, { center: [60, 40], radius: 5 })).toBe(true);
    const healed = pixel(buffer, 60, 40);
    healed.forEach((v, c) => expect(Math.abs(v - surrounding[c])).toBeLessThanOrEqual(4));
  });

  it('leaves pixels outside the blend radius untouched', () => {
    const buffer = skin(120, 80, [[60, 40, 4]]);
    const before = pixel(buffer, 60, 55);
    healSpot(buffer, { center: [60, 40], radius: 5 });
    expect(pixel(buffer, 60, 55)).toEqual(before);
  });

  it('gives up when there is no room for a source patch', () => {
    expect(healSpot(skin(12, 12, [[6, 6, 2]]), { center: [6, 6], radius: 5 })).toBe(false);
  });
});
