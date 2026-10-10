import type { Point, Rect } from '../document/types.js';

/** Default distance between baselines, as a multiple of the font size. */
export const LINE_HEIGHT = 1.2;

export type TextAlign = 'left' | 'center' | 'right';

export function cssFont(weight: string, size: number, family: string): string {
  return `${weight} ${size}px ${family}`;
}

export function textLines(text: string): string[] {
  return text.split('\n');
}

/** Where a line of `width` starts, relative to its anchor. */
export function alignOffset(align: TextAlign, width: number): number {
  return align === 'left' ? 0 : align === 'center' ? -width / 2 : -width;
}

/** Box covered by text drawn with draw_text at `position` (top edge) and `align`. */
export function textBox(position: Point, align: TextAlign, width: number, lineCount: number, size: number, lineHeight = LINE_HEIGHT): Rect {
  const [x, y] = position;
  return { x: round(x + alignOffset(align, width)), y: round(y), width, height: round(lineCount * size * lineHeight) };
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}
