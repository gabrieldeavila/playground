import { wrapText } from './wrap-text.js';

/** Width of a line of text drawn at a font size. */
export type MeasureAtSize = (line: string, size: number) => number;

export interface FitRequest {
  text: string;
  width: number;
  /** No height: only the width limits the size. */
  height?: number;
  maxSize: number;
  minSize: number;
  lineHeight: number;
}

export interface FittedText {
  lines: string[];
  size: number;
  /** True when even minSize doesn't fit. */
  overflows: boolean;
}

/** Biggest whole font size (between minSize and maxSize) whose wrapped text fits the box. */
export function fitText(request: FitRequest, measure: MeasureAtSize): FittedText {
  let low = Math.ceil(request.minSize);
  let high = Math.floor(request.maxSize);
  if (high < low) return wrapAt(request, request.maxSize, measure);
  let best: FittedText | null = null;
  while (low <= high) {
    const size = Math.floor((low + high) / 2);
    const attempt = wrapAt(request, size, measure);
    if (attempt.overflows) high = size - 1;
    else {
      best = attempt;
      low = size + 1;
    }
  }
  return best ?? wrapAt(request, request.minSize, measure);
}

/** Wraps the text to the box width at one size and says whether it fits. */
export function wrapAt(request: FitRequest, size: number, measure: MeasureAtSize): FittedText {
  const atSize = (line: string) => measure(line, size);
  const lines = wrapText(request.text, request.width, atSize);
  const tooWide = lines.some((line) => atSize(line) > request.width);
  const tooTall = request.height !== undefined && lines.length * size * request.lineHeight > request.height;
  return { lines, size, overflows: tooWide || tooTall };
}
