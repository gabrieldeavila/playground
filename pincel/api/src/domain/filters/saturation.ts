import { luminance, mapRgb, type PixelBuffer } from './pixel-buffer.js';

/** amount: -1 (gray) .. 0 (unchanged) .. 1 (twice as saturated) */
export function saturation(buffer: PixelBuffer, amount: number): PixelBuffer {
  return mapRgb(buffer, (rgb) => {
    const l = luminance(rgb);
    for (let c = 0; c < 3; c++) rgb[c] = l + (rgb[c] - l) * (1 + amount);
  });
}
