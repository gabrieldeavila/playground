import type { Point, Rect } from '../document/types.js';

/** Distance between baselines, as a multiple of the font size. */
export const LINE_HEIGHT = 1.2;

export type TextAlign = 'left' | 'center' | 'right';

export function cssFont(weight: string, size: number, family: string): string {
  return `${weight} ${size}px ${family}`;
}

export function textLines(text: string): string[] {
  return text.split('\n');
}

/** Box covered by text drawn with draw_text at `position` (top edge) and `align`. */
export function textBox(position: Point, align: TextAlign, width: number, lineCount: number, size: number): Rect {
  const [x, y] = position;
  const left = align === 'left' ? x : align === 'center' ? x - width / 2 : x - width;
  return { x: round(left), y, width, height: round(lineCount * size * LINE_HEIGHT) };
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}
