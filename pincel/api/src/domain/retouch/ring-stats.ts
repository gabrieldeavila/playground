import type { PixelBuffer } from '../filters/pixel-buffer.js';

/** Pixel indexes (into width*height) of a ring around (cx, cy), clipped to the image. */
export function ringPixels(buffer: PixelBuffer, cx: number, cy: number, inner: number, outer: number): number[] {
  const pixels: number[] = [];
  for (let y = Math.floor(cy - outer); y <= Math.ceil(cy + outer); y++) {
    for (let x = Math.floor(cx - outer); x <= Math.ceil(cx + outer); x++) {
      if (x < 0 || y < 0 || x >= buffer.width || y >= buffer.height) continue;
      const d = Math.hypot(x - cx, y - cy);
      if (d >= inner && d < outer) pixels.push(y * buffer.width + x);
    }
  }
  return pixels;
}

/** Per-channel median of the given pixels: robust to a neighbouring blemish in the ring. */
export function medianRgb({ data }: PixelBuffer, pixels: number[]): [number, number, number] {
  const channel = (c: number) => {
    const values = pixels.map((p) => data[p * 4 + c]).sort((a, b) => a - b);
    return values.length ? values[values.length >> 1] : 0;
  };
  return [channel(0), channel(1), channel(2)];
}
