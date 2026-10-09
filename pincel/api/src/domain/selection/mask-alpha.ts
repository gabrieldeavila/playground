import type { PixelBuffer } from '../filters/pixel-buffer.js';

/**
 * Masks and selections are grayscale images: white = fully selected/visible,
 * black (or transparent) = not. This turns one into an alpha mask in place:
 * white pixels whose alpha is the gray level.
 */
export function luminanceToAlpha(buffer: PixelBuffer): PixelBuffer {
  const { data } = buffer;
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    data[i + 3] = (gray * data[i + 3]) / 255;
    data[i] = data[i + 1] = data[i + 2] = 255;
  }
  return buffer;
}

/** The opposite direction: a 0..255 coverage array becomes an opaque grayscale image. */
export function coverageToGray(coverage: ArrayLike<number>, width: number, height: number): PixelBuffer {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let p = 0; p < coverage.length; p++) {
    const i = p * 4;
    data[i] = data[i + 1] = data[i + 2] = coverage[p];
    data[i + 3] = 255;
  }
  return { width, height, data };
}

/** Alpha channel of an image as 0..255 coverage (e.g. "select this layer's pixels"). */
export function alphaCoverage({ data }: PixelBuffer): Uint8Array {
  const coverage = new Uint8Array(data.length / 4);
  for (let p = 0; p < coverage.length; p++) coverage[p] = data[p * 4 + 3];
  return coverage;
}
