import type { PixelBuffer } from '../filters/pixel-buffer.js';
import { medianRgb, ringPixels } from './ring-stats.js';
import type { Spot } from './spot.js';

const DIRECTIONS = 16;

/**
 * Spot healing brush. Covers the spot with a nearby patch of the same image:
 * the candidate whose surroundings best match the spot's surroundings and
 * whose own content is smooth (so we don't copy another blemish). The patch is
 * shifted to the spot's surrounding color (median of the ring) and feathered in.
 * Returns false when no source patch fits inside the image.
 */
export function healSpot(buffer: PixelBuffer, spot: Spot): boolean {
  const [cx, cy] = spot.center;
  const core = Math.max(1, spot.radius);
  const blend = core * 1.6;
  const ringOuter = blend + Math.max(2, core * 0.6);
  const offset = bestSource(buffer, cx, cy, blend, ringOuter);
  if (!offset) return false;

  const targetRing = medianRgb(buffer, ringPixels(buffer, cx, cy, blend, ringOuter));
  const sourceRing = medianRgb(buffer, ringPixels(buffer, cx + offset[0], cy + offset[1], blend, ringOuter));
  const shift = targetRing.map((t, c) => t - sourceRing[c]);
  writePatch(buffer, cx, cy, core, blend, offset, shift);
  return true;
}

function writePatch(
  { width, height, data }: PixelBuffer,
  cx: number,
  cy: number,
  core: number,
  blend: number,
  [dx, dy]: [number, number],
  shift: number[],
): void {
  // Compute first, then write, so overlapping reads always see the original pixels.
  const writes: [number, number, number, number, number][] = [];
  for (let y = Math.floor(cy - blend); y <= Math.ceil(cy + blend); y++) {
    for (let x = Math.floor(cx - blend); x <= Math.ceil(cx + blend); x++) {
      if (x < 0 || y < 0 || x >= width || y >= height) continue;
      const d = Math.hypot(x - cx, y - cy);
      if (d >= blend) continue;
      const weight = d <= core ? 1 : smoothFalloff((d - core) / (blend - core));
      const target = (y * width + x) * 4;
      const source = ((y + dy) * width + (x + dx)) * 4;
      const rgb = [0, 1, 2].map((c) => data[target + c] + (data[source + c] + shift[c] - data[target + c]) * weight);
      writes.push([target, rgb[0], rgb[1], rgb[2], 0]);
    }
  }
  for (const [i, r, g, b] of writes) {
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }
}

/** 1 at t=0 down to 0 at t=1, smoothly. */
function smoothFalloff(t: number): number {
  const s = 1 - Math.min(1, Math.max(0, t));
  return s * s * (3 - 2 * s);
}

function bestSource(buffer: PixelBuffer, cx: number, cy: number, blend: number, ringOuter: number): [number, number] | null {
  const targetRing = ringPixels(buffer, cx, cy, blend, ringOuter);
  let best: { offset: [number, number]; score: number } | null = null;
  for (const distance of [2.3 * ringOuter, 3.2 * ringOuter]) {
    for (let k = 0; k < DIRECTIONS; k++) {
      const angle = (k / DIRECTIONS) * Math.PI * 2;
      const offset: [number, number] = [Math.round(Math.cos(angle) * distance), Math.round(Math.sin(angle) * distance)];
      if (!fits(buffer, cx + offset[0], cy + offset[1], ringOuter)) continue;
      const score = ringDifference(buffer, targetRing, offset) + 0.6 * roughness(buffer, cx + offset[0], cy + offset[1], blend);
      if (!best || score < best.score) best = { offset, score };
    }
  }
  return best?.offset ?? null;
}

function fits({ width, height }: PixelBuffer, x: number, y: number, radius: number): boolean {
  return x - radius >= 0 && y - radius >= 0 && x + radius < width && y + radius < height;
}

/** Mean RGB distance between the target's ring and the same ring shape around the source. */
function ringDifference({ width, data }: PixelBuffer, ring: number[], [dx, dy]: [number, number]): number {
  let total = 0;
  for (const p of ring) {
    const t = p * 4;
    const s = (p + dy * width + dx) * 4;
    total += Math.abs(data[t] - data[s]) + Math.abs(data[t + 1] - data[s + 1]) + Math.abs(data[t + 2] - data[s + 2]);
  }
  return ring.length ? total / ring.length : Infinity;
}

/** Standard deviation of brightness and of redness inside a disc: high when it has its own blemish or an edge. */
function roughness(buffer: PixelBuffer, cx: number, cy: number, radius: number): number {
  const pixels = ringPixels(buffer, cx, cy, 0, radius);
  const { data } = buffer;
  const spread = (value: (i: number) => number) => {
    const values = pixels.map((p) => value(p * 4));
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return Math.sqrt(values.reduce((a, v) => a + (v - mean) ** 2, 0) / values.length);
  };
  return spread((i) => data[i] + data[i + 1] + data[i + 2]) / 3 + spread((i) => data[i] - data[i + 1]);
}
