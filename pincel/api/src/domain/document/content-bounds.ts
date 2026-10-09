import type { PixelBuffer } from '../filters/pixel-buffer.js';
import type { Rect } from './types.js';

/** Smallest rectangle containing every non-transparent pixel, or null for an empty layer. */
export function contentBounds({ width, height, data }: PixelBuffer): Rect | null {
  const opaqueAt = (x: number, y: number) => data[(y * width + x) * 4 + 3] > 0;
  const rowHasContent = (y: number) => {
    for (let x = 0; x < width; x++) if (opaqueAt(x, y)) return true;
    return false;
  };

  let top = 0;
  while (top < height && !rowHasContent(top)) top++;
  if (top === height) return null;
  let bottom = height - 1;
  while (!rowHasContent(bottom)) bottom--;

  let left = width;
  let right = -1;
  for (let y = top; y <= bottom; y++) {
    for (let x = 0; x < left; x++) if (opaqueAt(x, y)) left = x;
    for (let x = width - 1; x > right; x--) if (opaqueAt(x, y)) right = x;
  }
  return { x: left, y: top, width: right - left + 1, height: bottom - top + 1 };
}
