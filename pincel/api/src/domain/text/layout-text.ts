import type { Point } from '../document/types.js';
import { textLines, type TextAlign } from '../paint/text-layout.js';
import { fitText, wrapAt, type MeasureAtSize } from './fit-text.js';

export type VerticalAlign = 'top' | 'middle' | 'bottom';

/** Area text is laid out in. Without a height, text just wraps to the width. */
export interface TextArea {
  x: number;
  y: number;
  width: number;
  height?: number;
}

export interface TextLayoutRequest {
  text: string;
  size: number;
  lineHeight: number;
  align: TextAlign;
  /** Free text: top edge of the first line, anchored by align. */
  position?: Point;
  /** Text box: wraps (and with fit="shrink", resizes) the text to the area. */
  box?: TextArea;
  fit: 'none' | 'shrink';
  minSize: number;
  verticalAlign: VerticalAlign;
}

export interface TextLayout {
  lines: string[];
  size: number;
  /** Anchor to draw at (top edge, horizontal anchor per align). */
  position: Point;
  /** The text doesn't fit its box. */
  overflows: boolean;
}

/** Decides lines, font size and anchor for text, either free (position) or in a box. */
export function layoutText(request: TextLayoutRequest, measure: MeasureAtSize): TextLayout {
  const { box, position } = request;
  if (box) return layoutInBox(request, box, measure);
  if (!position) throw new Error('Give either position or box for the text');
  return { lines: textLines(request.text), size: request.size, position, overflows: false };
}

function layoutInBox(request: TextLayoutRequest, box: TextArea, measure: MeasureAtSize): TextLayout {
  const fitRequest = { ...request, width: box.width, height: box.height, maxSize: request.size };
  const fitted = request.fit === 'shrink' ? fitText(fitRequest, measure) : wrapAt(fitRequest, request.size, measure);
  const textHeight = fitted.lines.length * fitted.size * request.lineHeight;
  return { ...fitted, position: [anchorX(box, request.align), anchorY(box, request.verticalAlign, textHeight)] };
}

function anchorX(box: TextArea, align: TextAlign): number {
  return align === 'left' ? box.x : align === 'center' ? box.x + box.width / 2 : box.x + box.width;
}

function anchorY(box: TextArea, verticalAlign: VerticalAlign, textHeight: number): number {
  const free = box.height === undefined ? 0 : box.height - textHeight;
  return verticalAlign === 'top' ? box.y : verticalAlign === 'middle' ? box.y + free / 2 : box.y + free;
}
