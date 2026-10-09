import { createCanvas } from '@napi-rs/canvas';
import { cssFont, LINE_HEIGHT, textLines } from '../domain/paint/text-layout.js';

export interface TextMetrics {
  width: number;
  height: number;
  lineHeight: number;
  lineWidths: number[];
}

const scratch = createCanvas(1, 1).getContext('2d');

/** Measures text with the same font and line height draw_text uses. */
export function measureText(text: string, size: number, font: string, weight: string): TextMetrics {
  scratch.font = cssFont(weight, size, font);
  const lineWidths = textLines(text).map((line) => round(scratch.measureText(line).width));
  return {
    width: Math.max(...lineWidths),
    height: round(lineWidths.length * size * LINE_HEIGHT),
    lineHeight: round(size * LINE_HEIGHT),
    lineWidths,
  };
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}
