import type { ShapeStyle } from '../commands/command-types.js';
import type { Ctx } from './surface.js';

/** Fills then strokes whatever path is currently on the context. */
export function paintCurrentPath(ctx: Ctx, style: ShapeStyle): void {
  if (style.fill) {
    ctx.fillStyle = style.fill;
    ctx.fill();
  }
  if (style.stroke && style.strokeWidth > 0) {
    ctx.strokeStyle = style.stroke;
    ctx.lineWidth = style.strokeWidth;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
  }
}
