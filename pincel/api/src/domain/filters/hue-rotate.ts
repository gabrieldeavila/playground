import { mapRgb, type PixelBuffer } from './pixel-buffer.js';

/** amount: degrees to rotate the hue (same matrix as CSS hue-rotate). */
export function hueRotate(buffer: PixelBuffer, degrees: number): PixelBuffer {
  const m = hueMatrix((degrees * Math.PI) / 180);
  return mapRgb(buffer, (rgb) => {
    const [r, g, b] = rgb;
    rgb[0] = m[0] * r + m[1] * g + m[2] * b;
    rgb[1] = m[3] * r + m[4] * g + m[5] * b;
    rgb[2] = m[6] * r + m[7] * g + m[8] * b;
  });
}

function hueMatrix(angle: number): number[] {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return [
    0.213 + cos * 0.787 - sin * 0.213,
    0.715 - cos * 0.715 - sin * 0.715,
    0.072 - cos * 0.072 + sin * 0.928,
    0.213 - cos * 0.213 + sin * 0.143,
    0.715 + cos * 0.285 + sin * 0.14,
    0.072 - cos * 0.072 - sin * 0.283,
    0.213 - cos * 0.213 - sin * 0.787,
    0.715 - cos * 0.715 + sin * 0.715,
    0.072 + cos * 0.928 + sin * 0.072,
  ];
}
