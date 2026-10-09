import type { CommandOf } from '../commands/command-types.js';
import { healSpot } from '../retouch/heal-spot.js';
import type { Ctx } from './surface.js';

/** Heals each spot in order, so already-healed skin can be used as a source for the next ones. */
export function healSpots(ctx: Ctx, cmd: CommandOf<'heal_spots'>): void {
  const { width, height } = ctx.canvas;
  const image = ctx.getImageData(0, 0, width, height);
  for (const spot of cmd.spots) healSpot(image, spot);
  ctx.putImageData(image, 0, 0);
}
