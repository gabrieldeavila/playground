import type { CommandOf } from '../commands/command-types.js';
import type { PaintEnv, Surface } from './surface.js';

/** Moves/scales/rotates/flips the layer's pixels around the canvas center. */
export function transformLayer(surface: Surface, cmd: CommandOf<'transform_layer'>, env: PaintEnv): void {
  const { width, height } = surface;
  const copy = env.createSurface(width, height);
  copy.getContext('2d').drawImage(surface, 0, 0);
  const ctx = surface.getContext('2d');
  ctx.save();
  ctx.clearRect(0, 0, width, height);
  ctx.translate(width / 2 + cmd.dx, height / 2 + cmd.dy);
  ctx.rotate((cmd.rotation * Math.PI) / 180);
  ctx.scale(cmd.scale * (cmd.flipX ? -1 : 1), cmd.scale * (cmd.flipY ? -1 : 1));
  ctx.drawImage(copy, -width / 2, -height / 2);
  ctx.restore();
}
