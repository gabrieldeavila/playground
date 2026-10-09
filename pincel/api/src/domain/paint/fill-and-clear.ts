import type { CommandOf } from '../commands/command-types.js';
import type { Ctx } from './surface.js';

export function fillLayer(ctx: Ctx, cmd: CommandOf<'fill_layer'>): void {
  ctx.fillStyle = cmd.color;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

export function clearLayer(ctx: Ctx, cmd: CommandOf<'clear_layer'>): void {
  const r = cmd.rect ?? { x: 0, y: 0, width: ctx.canvas.width, height: ctx.canvas.height };
  ctx.clearRect(r.x, r.y, r.width, r.height);
}
