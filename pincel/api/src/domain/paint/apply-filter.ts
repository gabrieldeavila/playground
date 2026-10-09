import type { CommandOf } from '../commands/command-types.js';
import { FILTERS } from '../filters/filter-catalog.js';
import type { Rect } from '../document/types.js';
import type { Ctx } from './surface.js';

export function applyFilter(ctx: Ctx, cmd: CommandOf<'apply_filter'>): void {
  const area = clipToCanvas(cmd.rect, ctx.canvas.width, ctx.canvas.height);
  if (!area) return;
  const image = ctx.getImageData(area.x, area.y, area.width, area.height);
  FILTERS[cmd.filter].apply(image, cmd.amount);
  ctx.putImageData(image, area.x, area.y);
}

function clipToCanvas(rect: Rect | undefined, width: number, height: number): Rect | null {
  if (!rect) return { x: 0, y: 0, width, height };
  const x = Math.max(0, Math.floor(rect.x));
  const y = Math.max(0, Math.floor(rect.y));
  const right = Math.min(width, Math.ceil(rect.x + rect.width));
  const bottom = Math.min(height, Math.ceil(rect.y + rect.height));
  return right > x && bottom > y ? { x, y, width: right - x, height: bottom - y } : null;
}
