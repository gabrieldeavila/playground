import type { Point } from './types';

export interface DisplayBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Converts a pointer position on the scaled canvas element into document pixels. */
export function toCanvasPoint(clientX: number, clientY: number, box: DisplayBox, doc: { width: number; height: number }): Point {
  const x = ((clientX - box.left) / box.width) * doc.width;
  const y = ((clientY - box.top) / box.height) * doc.height;
  return [Math.round(x * 10) / 10, Math.round(y * 10) / 10];
}

/** Largest zoom that fits the document into the viewport, never above 100%. */
export function fitZoom(doc: { width: number; height: number }, viewport: { width: number; height: number }, padding = 48): number {
  const zoom = Math.min((viewport.width - padding) / doc.width, (viewport.height - padding) / doc.height);
  return Math.max(0.05, Math.min(1, zoom));
}
