import type { CommandOf } from '../commands/command-types.js';
import type { Ctx } from './surface.js';

export function drawGradient(ctx: Ctx, cmd: CommandOf<'draw_gradient'>): void {
  const [x0, y0] = cmd.from;
  const [x1, y1] = cmd.to;
  const gradient =
    cmd.kind === 'linear'
      ? ctx.createLinearGradient(x0, y0, x1, y1)
      : ctx.createRadialGradient(x0, y0, 0, x0, y0, Math.hypot(x1 - x0, y1 - y0));
  for (const stop of cmd.stops) gradient.addColorStop(clamp01(stop.offset), stop.color);
  const area = cmd.rect ?? { x: 0, y: 0, width: ctx.canvas.width, height: ctx.canvas.height };
  ctx.fillStyle = gradient;
  ctx.fillRect(area.x, area.y, area.width, area.height);
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
