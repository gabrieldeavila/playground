import { mapRgb, type PixelBuffer } from './pixel-buffer.js';

/** amount: number of tone levels per channel (2..255). */
export function posterize(buffer: PixelBuffer, levels: number): PixelBuffer {
  const steps = Math.max(1, Math.round(levels) - 1);
  return mapRgb(buffer, (rgb) => {
    for (let c = 0; c < 3; c++) rgb[c] = (Math.round((rgb[c] / 255) * steps) / steps) * 255;
  });
}
