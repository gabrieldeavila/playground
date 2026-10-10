import type { CommandOf } from '../commands/command-types.js';
import type { Ctx } from './surface.js';
import { alignOffset, cssFont, LINE_HEIGHT, textLines } from './text-layout.js';

/** Draws text with its top edge at `position`. Newlines start a new line. */
export function drawText(ctx: Ctx, cmd: CommandOf<'draw_text'>): void {
  const spacing = cmd.letterSpacing ?? 0;
  const lineStep = cmd.size * (cmd.lineHeight ?? LINE_HEIGHT);
  ctx.font = cssFont(cmd.weight, cmd.size, cmd.font);
  ctx.letterSpacing = `${spacing}px`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.translate(cmd.position[0], cmd.position[1]);
  ctx.rotate(((cmd.rotation ?? 0) * Math.PI) / 180);
  textLines(cmd.text).forEach((line, i) => {
    const x = alignOffset(cmd.align, lineWidth(ctx, line, spacing));
    drawLine(ctx, cmd, line, x, i * lineStep);
  });
}

function drawLine(ctx: Ctx, cmd: CommandOf<'draw_text'>, line: string, x: number, y: number): void {
  if (cmd.stroke && cmd.strokeWidth) {
    // Stroked twice as wide under the fill, so the outline only shows outside the letters.
    ctx.strokeStyle = cmd.stroke;
    ctx.lineWidth = cmd.strokeWidth * 2;
    ctx.lineJoin = 'round';
    ctx.strokeText(line, x, y);
  }
  ctx.fillStyle = cmd.color;
  ctx.fillText(line, x, y);
}

/** Canvas adds letter spacing after the last letter too; leave it out so alignment is exact. */
export function lineWidth(ctx: Ctx, line: string, spacing: number): number {
  const width = ctx.measureText(line).width;
  return line.length > 0 ? width - spacing : width;
}
