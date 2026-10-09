import type { Rect } from '../document/types.js';
import type { PixelBuffer } from '../filters/pixel-buffer.js';
import type { Spot } from './spot.js';

export interface FindSpotsOptions {
  /** How much redder than the surrounding skin a spot must be (red − green, 0..255). */
  threshold: number;
  maxRadius: number;
  minRadius: number;
  /** Only look here. */
  region?: Rect;
  /** Only keep spots whose center is allowed (e.g. inside the selection). */
  allowed?: (x: number, y: number) => boolean;
}

export interface FoundSpot extends Spot {
  /** How much redder than its surroundings, 0..255. */
  strength: number;
}

/**
 * Blemish detector: finds small blobs whose redness (R − G) stands out from the
 * local average. Large red areas (lips, flushed cheeks) are too big to count.
 */
export function findSpots(buffer: PixelBuffer, options: FindSpotsOptions): FoundSpot[] {
  const { width, height, data } = buffer;
  const redness = new Float32Array(width * height);
  for (let p = 0; p < redness.length; p++) redness[p] = data[p * 4] - data[p * 4 + 1];
  const background = boxBlur(boxBlur(redness, width, height, Math.round(options.maxRadius * 2)), width, height, Math.round(options.maxRadius * 2));

  const area = options.region ?? { x: 0, y: 0, width, height };
  const inArea = (x: number, y: number) => x >= area.x && y >= area.y && x < area.x + area.width && y < area.y + area.height;
  const hot = new Uint8Array(width * height);
  for (let p = 0; p < hot.length; p++) {
    if (data[p * 4 + 3] > 0 && redness[p] - background[p] > options.threshold && inArea(p % width, Math.floor(p / width))) hot[p] = 1;
  }
  return blobs(hot, redness, background, width)
    .filter((b) => b.area >= Math.PI * options.minRadius ** 2 && b.area <= Math.PI * options.maxRadius ** 2)
    .map((b) => ({
      center: [round(b.cx), round(b.cy)] as [number, number],
      radius: round(Math.sqrt(b.area / Math.PI) * 1.3 + 1),
      strength: Math.round(b.peak),
    }))
    .filter((s) => !options.allowed || options.allowed(Math.round(s.center[0]), Math.round(s.center[1])))
    .sort((a, b) => b.strength - a.strength);
}

interface Blob {
  area: number;
  cx: number;
  cy: number;
  peak: number;
}

/** 4-connected components of `hot`, with a centroid weighted by how strongly each pixel stands out. */
function blobs(hot: Uint8Array, redness: Float32Array, background: Float32Array, width: number): Blob[] {
  const seen = new Uint8Array(hot.length);
  const found: Blob[] = [];
  for (let start = 0; start < hot.length; start++) {
    if (!hot[start] || seen[start]) continue;
    const stack = [start];
    seen[start] = 1;
    let area = 0, weight = 0, sx = 0, sy = 0, peak = 0;
    while (stack.length) {
      const p = stack.pop()!;
      const w = redness[p] - background[p];
      area++;
      weight += w;
      sx += (p % width) * w;
      sy += Math.floor(p / width) * w;
      peak = Math.max(peak, w);
      const x = p % width;
      for (const n of [p - width, p + width, x > 0 ? p - 1 : -1, x < width - 1 ? p + 1 : -1]) {
        if (n >= 0 && n < hot.length && hot[n] && !seen[n]) {
          seen[n] = 1;
          stack.push(n);
        }
      }
    }
    found.push({ area, cx: sx / weight, cy: sy / weight, peak });
  }
  return found;
}

/** Separable box blur of a single float channel. */
function boxBlur(values: Float32Array, width: number, height: number, radius: number): Float32Array {
  const pass = (input: Float32Array, horizontal: boolean) => {
    const out = new Float32Array(input.length);
    const length = horizontal ? width : height;
    const lines = horizontal ? height : width;
    for (let l = 0; l < lines; l++) {
      const at = (i: number) => {
        const c = Math.min(length - 1, Math.max(0, i));
        return horizontal ? input[l * width + c] : input[c * width + l];
      };
      let sum = 0;
      for (let i = -radius; i <= radius; i++) sum += at(i);
      for (let i = 0; i < length; i++) {
        out[horizontal ? l * width + i : i * width + l] = sum / (radius * 2 + 1);
        sum += at(i + radius + 1) - at(i - radius);
      }
    }
    return out;
  };
  return pass(pass(values, true), false);
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}
