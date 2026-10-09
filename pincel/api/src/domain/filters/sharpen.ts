import type { PixelBuffer } from './pixel-buffer.js';

/** amount: 0 (none) .. ~2 (strong). Unsharp 3x3 kernel on RGB. */
export function sharpen(buffer: PixelBuffer, amount: number): PixelBuffer {
  const { width, height, data } = buffer;
  const source = new Uint8ClampedArray(data);
  const at = (x: number, y: number, c: number) =>
    source[(clampTo(y, height) * width + clampTo(x, width)) * 4 + c];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      for (let c = 0; c < 3; c++) {
        const center = at(x, y, c);
        const neighbours = at(x - 1, y, c) + at(x + 1, y, c) + at(x, y - 1, c) + at(x, y + 1, c);
        data[(y * width + x) * 4 + c] = center + amount * (4 * center - neighbours);
      }
    }
  }
  return buffer;
}

function clampTo(value: number, length: number): number {
  return value < 0 ? 0 : value >= length ? length - 1 : value;
}
