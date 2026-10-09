import { mapRgb, mix, type PixelBuffer } from './pixel-buffer.js';

/** amount: 0 (none) .. 1 (full sepia) */
export function sepia(buffer: PixelBuffer, amount: number): PixelBuffer {
  return mapRgb(buffer, (rgb) => {
    const [r, g, b] = rgb;
    const toned = [
      0.393 * r + 0.769 * g + 0.189 * b,
      0.349 * r + 0.686 * g + 0.168 * b,
      0.272 * r + 0.534 * g + 0.131 * b,
    ];
    for (let c = 0; c < 3; c++) rgb[c] = mix(rgb[c], toned[c], amount);
  });
}
