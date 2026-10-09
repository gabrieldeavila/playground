import { describe, expect, it } from 'vitest';
import type { PixelBuffer } from '../filters/pixel-buffer.js';
import { pushWarp } from './push-warp.js';

/** Gray image with one white dot. */
function dotImage(x: number, y: number): PixelBuffer {
  const data = new Uint8ClampedArray(60 * 60 * 4).fill(100);
  for (let i = 3; i < data.length; i += 4) data[i] = 255;
  data.set([255, 255, 255, 255], (y * 60 + x) * 4);
  return { width: 60, height: 60, data };
}

const brightest = (b: PixelBuffer) => {
  let best = 0;
  for (let p = 1; p < b.width * b.height; p++) if (b.data[p * 4] > b.data[best * 4]) best = p;
  return [best % b.width, Math.floor(best / b.width)];
};

describe('pushWarp', () => {
  it('moves content at `from` to `to`', () => {
    const image = dotImage(30, 30);
    pushWarp(image, { from: [30, 30], to: [30, 25], radius: 20 });
    expect(brightest(image)).toEqual([30, 25]);
  });

  it('does nothing when from equals to', () => {
    const image = dotImage(30, 30);
    const before = new Uint8ClampedArray(image.data);
    pushWarp(image, { from: [30, 30], to: [30, 30], radius: 20 });
    expect(image.data).toEqual(before);
  });

  it('leaves pixels outside the radius alone', () => {
    const image = dotImage(5, 5);
    pushWarp(image, { from: [40, 40], to: [40, 35], radius: 10 });
    expect(brightest(image)).toEqual([5, 5]);
  });
});
