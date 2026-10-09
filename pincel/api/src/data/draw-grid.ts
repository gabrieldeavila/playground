import { gridPositions } from '../domain/document/grid-lines.js';
import type { Rect } from '../domain/document/types.js';
import type { Ctx } from '../domain/paint/surface.js';

/**
 * Draws labelled grid lines over a rendered image. `region` is the document area
 * the image shows and `scale` its zoom, so labels are in document pixels.
 */
export function drawGrid(ctx: Ctx, region: Rect, scale: number, spacing: number): void {
  const { width, height } = ctx.canvas;
  ctx.save();
  ctx.font = '11px sans-serif';
  ctx.textBaseline = 'top';
  for (const x of gridPositions(region.x, region.x + region.width, spacing)) {
    const px = Math.round((x - region.x) * scale) + 0.5;
    line(ctx, px, 0, px, height);
    label(ctx, String(x), px + 3, 2);
  }
  for (const y of gridPositions(region.y, region.y + region.height, spacing)) {
    const py = Math.round((y - region.y) * scale) + 0.5;
    line(ctx, 0, py, width, py);
    label(ctx, String(y), 3, py + 2);
  }
  ctx.restore();
}

function line(ctx: Ctx, x0: number, y0: number, x1: number, y1: number): void {
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(255, 0, 170, 0.55)';
  ctx.stroke();
}

/** Text with a dark backing so it reads on any image. */
function label(ctx: Ctx, text: string, x: number, y: number): void {
  const { width } = ctx.measureText(text);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(x - 2, y - 1, width + 4, 13);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, x, y);
}
