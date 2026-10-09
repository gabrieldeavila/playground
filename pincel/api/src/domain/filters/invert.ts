import { mapRgb, mix, type PixelBuffer } from './pixel-buffer.js';

/** amount: 0 (none) .. 1 (fully inverted) */
export function invert(buffer: PixelBuffer, amount: number): PixelBuffer {
  return mapRgb(buffer, (rgb) => {
    for (let c = 0; c < 3; c++) rgb[c] = mix(rgb[c], 255 - rgb[c], amount);
  });
}
