import type { CommandOf } from '../commands/command-types.js';
import { paintCurrentPath } from './shape-style.js';
import type { Ctx } from './surface.js';

export function drawRect(ctx: Ctx, cmd: CommandOf<'draw_rect'>): void {
  const { x, y, width, height } = cmd.rect;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, cmd.radius);
  paintCurrentPath(ctx, cmd.style);
}

export function drawEllipse(ctx: Ctx, cmd: CommandOf<'draw_ellipse'>): void {
  const [cx, cy] = cmd.center;
  ctx.beginPath();
  ctx.ellipse(cx, cy, Math.abs(cmd.radiusX), Math.abs(cmd.radiusY), 0, 0, Math.PI * 2);
  paintCurrentPath(ctx, cmd.style);
}

export function drawPath(ctx: Ctx, cmd: CommandOf<'draw_path'>): void {
  const [first, ...rest] = cmd.points;
  if (!first) return;
  ctx.beginPath();
  ctx.moveTo(first[0], first[1]);
  for (const [x, y] of rest) ctx.lineTo(x, y);
  if (cmd.closed) ctx.closePath();
  paintCurrentPath(ctx, cmd.style);
}
