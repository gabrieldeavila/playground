import type { PixelBuffer } from '../filters/pixel-buffer.js';

/** Pixels on the border of a grayscale selection (inside, with an outside 4-neighbour or the canvas edge). */
export function selectionEdges({ width, height, data }: PixelBuffer): Uint8Array {
  const inside = (x: number, y: number) =>
    x >= 0 && y >= 0 && x < width && y < height && data[(y * width + x) * 4] >= 128 && data[(y * width + x) * 4 + 3] >= 128;
  const edges = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!inside(x, y)) continue;
      if (!inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1)) edges[y * width + x] = 1;
    }
  }
  return edges;
}
