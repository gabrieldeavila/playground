import type { CommandOf } from '../commands/command-types.js';
import { pushWarp } from '../retouch/push-warp.js';
import type { Ctx } from './surface.js';

/** Applies push strokes in order, each one warping the result of the previous. */
export function liquify(ctx: Ctx, cmd: CommandOf<'liquify'>): void {
  const { width, height } = ctx.canvas;
  const image = ctx.getImageData(0, 0, width, height);
  for (const stroke of cmd.strokes) pushWarp(image, stroke);
  ctx.putImageData(image, 0, 0);
}
