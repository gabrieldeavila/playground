import { clipToAlpha, copySurface } from './surface-ops.js';
import type { PaintEnv, Surface } from './surface.js';

/**
 * Lets any painting operation respect the selection: it runs on the surface,
 * then only the selected part of the change is kept. With a soft selection the
 * result is before·(1−s) + after·s, done with premultiplied "lighter" adds.
 */
export async function paintInsideSelection(
  surface: Surface,
  selectionAlpha: Surface,
  paint: () => void | Promise<void>,
  env: PaintEnv,
): Promise<void> {
  const before = copySurface(surface, env);
  await paint();
  const changed = copySurface(surface, env);
  clipToAlpha(before, selectionAlpha, 'destination-out');
  clipToAlpha(changed, selectionAlpha, 'destination-in');
  const ctx = surface.getContext('2d');
  ctx.save();
  ctx.clearRect(0, 0, surface.width, surface.height);
  ctx.drawImage(before, 0, 0);
  ctx.globalCompositeOperation = 'lighter';
  ctx.drawImage(changed, 0, 0);
  ctx.restore();
}
