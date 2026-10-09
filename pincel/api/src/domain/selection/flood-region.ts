import type { PixelBuffer } from '../filters/pixel-buffer.js';

/**
 * Magic-wand region: pixels whose RGBA is within `tolerance` (0..255, per channel)
 * of the clicked pixel. Contiguous mode only spreads through 4-connected neighbours.
 * Returns 255 for pixels in the region, 0 elsewhere.
 */
export function floodRegion(buffer: PixelBuffer, x: number, y: number, tolerance: number, contiguous: boolean): Uint8Array {
  const { width, height, data } = buffer;
  const region = new Uint8Array(width * height);
  const sx = Math.floor(x);
  const sy = Math.floor(y);
  if (sx < 0 || sy < 0 || sx >= width || sy >= height) return region;
  const seed = (sy * width + sx) * 4;
  const target = [data[seed], data[seed + 1], data[seed + 2], data[seed + 3]];
  const matches = (pixel: number) => {
    const i = pixel * 4;
    for (let c = 0; c < 4; c++) if (Math.abs(data[i + c] - target[c]) > tolerance) return false;
    return true;
  };

  if (!contiguous) {
    for (let p = 0; p < region.length; p++) if (matches(p)) region[p] = 255;
    return region;
  }

  const stack = [sy * width + sx];
  region[stack[0]] = 255;
  while (stack.length > 0) {
    const p = stack.pop()!;
    const px = p % width;
    for (const n of [p - width, p + width, px > 0 ? p - 1 : -1, px < width - 1 ? p + 1 : -1]) {
      if (n < 0 || n >= region.length || region[n] || !matches(n)) continue;
      region[n] = 255;
      stack.push(n);
    }
  }
  return region;
}
