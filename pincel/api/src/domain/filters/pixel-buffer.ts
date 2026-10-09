/** Same shape as the DOM ImageData: RGBA, unpremultiplied, row-major. */
export interface PixelBuffer {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

export type Rgb = [r: number, g: number, b: number];

/** Runs `fn` over every pixel's RGB in place. Alpha is left untouched. */
export function mapRgb(buffer: PixelBuffer, fn: (rgb: Rgb) => void): PixelBuffer {
  const { data } = buffer;
  const rgb: Rgb = [0, 0, 0];
  for (let i = 0; i < data.length; i += 4) {
    rgb[0] = data[i];
    rgb[1] = data[i + 1];
    rgb[2] = data[i + 2];
    fn(rgb);
    data[i] = rgb[0];
    data[i + 1] = rgb[1];
    data[i + 2] = rgb[2];
  }
  return buffer;
}

export function luminance([r, g, b]: Rgb): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function mix(from: number, to: number, amount: number): number {
  return from + (to - from) * amount;
}
