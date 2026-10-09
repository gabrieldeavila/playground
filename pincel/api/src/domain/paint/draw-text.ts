import type { CommandOf } from '../commands/command-types.js';
import type { Ctx } from './surface.js';
import { cssFont, LINE_HEIGHT, textLines } from './text-layout.js';

/** Draws text with its top edge at `position`. Newlines start a new line. */
export function drawText(ctx: Ctx, cmd: CommandOf<'draw_text'>): void {
  const [x, y] = cmd.position;
  ctx.font = cssFont(cmd.weight, cmd.size, cmd.font);
  ctx.fillStyle = cmd.color;
  ctx.textAlign = cmd.align;
  ctx.textBaseline = 'top';
  textLines(cmd.text).forEach((line, i) => ctx.fillText(line, x, y + i * cmd.size * LINE_HEIGHT));
}
