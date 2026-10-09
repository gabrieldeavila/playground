import type { PixelBuffer } from './pixel-buffer.js';

/**
 * amount: radius in pixels. Three box-blur passes approximate a gaussian.
 * Works on premultiplied alpha so transparent edges don't turn dark.
 */
export function blur(buffer: PixelBuffer, radius: number): PixelBuffer {
  const r = Math.max(0, Math.round(radius));
  if (r === 0) return buffer;
  const channels = toPremultiplied(buffer);
  for (let pass = 0; pass < 3; pass++) {
    boxBlur(channels, buffer.width, buffer.height, r, 1, buffer.width);
    boxBlur(channels, buffer.height, buffer.width, r, buffer.width, 1);
  }
  fromPremultiplied(channels, buffer);
  return buffer;
}

function toPremultiplied({ data }: PixelBuffer): Float32Array {
  const out = new Float32Array(data.length);
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3] / 255;
    out[i] = data[i] * a;
    out[i + 1] = data[i + 1] * a;
    out[i + 2] = data[i + 2] * a;
    out[i + 3] = data[i + 3];
  }
  return out;
}

function fromPremultiplied(channels: Float32Array, { data }: PixelBuffer): void {
  for (let i = 0; i < data.length; i += 4) {
    const a = channels[i + 3];
    const scale = a > 0 ? 255 / a : 0;
    data[i] = channels[i] * scale;
    data[i + 1] = channels[i + 1] * scale;
    data[i + 2] = channels[i + 2] * scale;
    data[i + 3] = a;
  }
}

/**
 * Sliding-window average along one axis.
 * `length` pixels per line, `lines` lines; `step`/`lineStep` are pixel strides.
 */
function boxBlur(
  channels: Float32Array,
  length: number,
  lines: number,
  radius: number,
  step: number,
  lineStep: number,
): void {
  const line = new Float32Array(length * 4);
  const window = radius * 2 + 1;
  for (let l = 0; l < lines; l++) {
    const start = l * lineStep;
    for (let i = 0; i < length; i++) {
      const p = (start + i * step) * 4;
      for (let c = 0; c < 4; c++) line[i * 4 + c] = channels[p + c];
    }
    for (let c = 0; c < 4; c++) {
      let sum = 0;
      for (let k = -radius; k <= radius; k++) sum += line[clamp(k, length) * 4 + c];
      for (let i = 0; i < length; i++) {
        channels[(start + i * step) * 4 + c] = sum / window;
        sum += line[clamp(i + radius + 1, length) * 4 + c] - line[clamp(i - radius, length) * 4 + c];
      }
    }
  }
}

function clamp(index: number, length: number): number {
  return index < 0 ? 0 : index >= length ? length - 1 : index;
}
