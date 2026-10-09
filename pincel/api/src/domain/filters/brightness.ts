import { mapRgb, type PixelBuffer } from './pixel-buffer.js';

/** amount: -1 (black) .. 0 (unchanged) .. 1 (white) */
export function brightness(buffer: PixelBuffer, amount: number): PixelBuffer {
  const shift = amount * 255;
  return mapRgb(buffer, (rgb) => {
    for (let c = 0; c < 3; c++) rgb[c] += shift;
  });
}
