import { createCanvas } from '@napi-rs/canvas';
import { lineWidth } from '../domain/paint/draw-text.js';
import { cssFont, textLines } from '../domain/paint/text-layout.js';
import type { MeasureAtSize } from '../domain/text/fit-text.js';

export interface TextStyle {
  size: number;
  font: string;
  weight: string;
  letterSpacing: number;
  lineHeight: number;
}

export interface TextMetrics {
  width: number;
  height: number;
  lineHeight: number;
  lineWidths: number[];
}

const scratch = createCanvas(1, 1).getContext('2d');

/** Measures text with the same font, spacing and line height draw_text uses. */
export function measureText(text: string, style: TextStyle): TextMetrics {
  const measure = measurerFor(style);
  const lineWidths = textLines(text).map((line) => round(measure(line, style.size)));
  return {
    width: Math.max(...lineWidths),
    height: round(lineWidths.length * style.size * style.lineHeight),
    lineHeight: round(style.size * style.lineHeight),
    lineWidths,
  };
}

/** Line width at any font size, for wrapping and fitting text to a box. */
export function measurerFor(style: Omit<TextStyle, 'size'>): MeasureAtSize {
  return (line, size) => {
    scratch.font = cssFont(style.weight, size, style.font);
    scratch.letterSpacing = `${style.letterSpacing}px`;
    return lineWidth(scratch, line, style.letterSpacing);
  };
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}
