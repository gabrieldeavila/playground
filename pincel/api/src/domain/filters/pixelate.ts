import type { PixelBuffer } from './pixel-buffer.js';

/** amount: block size in pixels. Each block takes the color of its top-left pixel. */
export function pixelate(buffer: PixelBuffer, blockSize: number): PixelBuffer {
  const size = Math.max(1, Math.round(blockSize));
  const { width, height, data } = buffer;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const source = ((y - (y % size)) * width + (x - (x % size))) * 4;
      const target = (y * width + x) * 4;
      for (let c = 0; c < 4; c++) data[target + c] = data[source + c];
    }
  }
  return buffer;
}
