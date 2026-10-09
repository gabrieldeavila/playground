import type { CommandOf } from '../commands/command-types.js';
import type { Ctx } from './surface.js';

/** Round brush (or eraser) through the points, smoothed with quadratic curves. */
export function brushStroke(ctx: Ctx, cmd: CommandOf<'brush_stroke'>): void {
  const { points } = cmd;
  if (points.length === 0) return;
  ctx.save();
  ctx.globalAlpha = cmd.opacity;
  ctx.globalCompositeOperation = cmd.erase ? 'destination-out' : 'source-over';
  ctx.strokeStyle = cmd.color;
  ctx.fillStyle = cmd.color;
  ctx.lineWidth = cmd.size;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (points.length === 1) dot(ctx, points[0], cmd.size);
  else smoothLine(ctx, points);
  ctx.restore();
}

function dot(ctx: Ctx, [x, y]: [number, number], size: number): void {
  ctx.beginPath();
  ctx.arc(x, y, size / 2, 0, Math.PI * 2);
  ctx.fill();
}

function smoothLine(ctx: Ctx, points: [number, number][]): void {
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length - 1; i++) {
    const [x, y] = points[i];
    const [nx, ny] = points[i + 1];
    ctx.quadraticCurveTo(x, y, (x + nx) / 2, (y + ny) / 2);
  }
  const [lx, ly] = points[points.length - 1];
  ctx.lineTo(lx, ly);
  ctx.stroke();
}
