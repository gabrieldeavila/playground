import type { Point } from '../document/types.js';
import type { PixelBuffer } from '../filters/pixel-buffer.js';

export interface PushStroke {
  from: Point;
  to: Point;
  /** Area of influence around `from`; keep the push well under half of it for a smooth result. */
  radius: number;
}

/**
 * Liquify "forward warp": content around `from` slides toward `to`, fading out
 * smoothly at `radius`. Done by inverse mapping (each output pixel samples the
 * displaced source with bilinear filtering), so there are no holes.
 */
export function pushWarp(buffer: PixelBuffer, { from, to, radius }: PushStroke): void {
  const { width, height, data } = buffer;
  const [dx, dy] = [to[0] - from[0], to[1] - from[1]];
  const reach = radius + Math.hypot(dx, dy);
  const source = new Uint8ClampedArray(data);
  for (let y = Math.max(0, Math.floor(from[1] - reach)); y <= Math.min(height - 1, Math.ceil(from[1] + reach)); y++) {
    for (let x = Math.max(0, Math.floor(from[0] - reach)); x <= Math.min(width - 1, Math.ceil(from[0] + reach)); x++) {
      const weight = falloff(Math.hypot(x - dx - from[0], y - dy - from[1]) / radius);
      if (weight === 0) continue;
      sampleInto(source, data, width, height, x - dx * weight, y - dy * weight, (y * width + x) * 4);
    }
  }
}

/** Smooth bump: 1 at the center, 0 at the edge, flat at both ends. */
function falloff(t: number): number {
  if (t >= 1) return 0;
  const s = 1 - t * t;
  return s * s;
}

function sampleInto(source: Uint8ClampedArray, out: Uint8ClampedArray, width: number, height: number, sx: number, sy: number, target: number): void {
  const x0 = Math.max(0, Math.min(width - 1, Math.floor(sx)));
  const y0 = Math.max(0, Math.min(height - 1, Math.floor(sy)));
  const x1 = Math.min(width - 1, x0 + 1);
  const y1 = Math.min(height - 1, y0 + 1);
  const fx = Math.max(0, Math.min(1, sx - x0));
  const fy = Math.max(0, Math.min(1, sy - y0));
  for (let c = 0; c < 4; c++) {
    const top = source[(y0 * width + x0) * 4 + c] * (1 - fx) + source[(y0 * width + x1) * 4 + c] * fx;
    const bottom = source[(y1 * width + x0) * 4 + c] * (1 - fx) + source[(y1 * width + x1) * 4 + c] * fx;
    out[target + c] = top * (1 - fy) + bottom * fy;
  }
}
