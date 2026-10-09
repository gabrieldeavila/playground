import type { CommandOf } from '../commands/command-types.js';
import { floodRegion } from '../selection/flood-region.js';
import type { PaintEnv, Surface } from './surface.js';

/** Paint bucket: fills the region of similar color around `point` (decided on `sample`). */
export function floodFill(target: Surface, sample: Surface, cmd: CommandOf<'flood_fill'>, env: PaintEnv): void {
  const { width, height } = target;
  const image = sample.getContext('2d').getImageData(0, 0, width, height);
  const region = floodRegion(image, cmd.point[0], cmd.point[1], cmd.tolerance, cmd.contiguous);
  const paint = env.createSurface(width, height);
  const ctx = paint.getContext('2d');
  const regionImage = ctx.createImageData(width, height);
  for (let p = 0; p < region.length; p++) regionImage.data[p * 4 + 3] = region[p];
  ctx.putImageData(regionImage, 0, 0);
  ctx.globalCompositeOperation = 'source-in';
  ctx.fillStyle = cmd.color;
  ctx.fillRect(0, 0, width, height);
  target.getContext('2d').drawImage(paint, 0, 0);
}
