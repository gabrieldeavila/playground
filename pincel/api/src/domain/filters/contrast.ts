import { mapRgb, type PixelBuffer } from './pixel-buffer.js';

/** amount: -1 (flat gray) .. 0 (unchanged) .. 1 (maximum contrast) */
export function contrast(buffer: PixelBuffer, amount: number): PixelBuffer {
  const c = Math.max(-255, Math.min(254, amount * 255));
  const factor = (259 * (c + 255)) / (255 * (259 - c));
  return mapRgb(buffer, (rgb) => {
    for (let i = 0; i < 3; i++) rgb[i] = factor * (rgb[i] - 128) + 128;
  });
}
