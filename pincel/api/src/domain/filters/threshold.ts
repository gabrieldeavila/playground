import { luminance, mapRgb, type PixelBuffer } from './pixel-buffer.js';

/** amount: 0..1 cut-off; brighter pixels become white, the rest black. */
export function threshold(buffer: PixelBuffer, amount: number): PixelBuffer {
  const cut = amount * 255;
  return mapRgb(buffer, (rgb) => {
    const value = luminance(rgb) >= cut ? 255 : 0;
    rgb[0] = rgb[1] = rgb[2] = value;
  });
}
