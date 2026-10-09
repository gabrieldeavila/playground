import { luminance, mapRgb, mix, type PixelBuffer } from './pixel-buffer.js';

/** amount: 0 (none) .. 1 (fully gray) */
export function grayscale(buffer: PixelBuffer, amount: number): PixelBuffer {
  return mapRgb(buffer, (rgb) => {
    const l = luminance(rgb);
    for (let c = 0; c < 3; c++) rgb[c] = mix(rgb[c], l, amount);
  });
}
