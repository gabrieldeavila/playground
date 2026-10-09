import type { CommandOf } from '../commands/command-types.js';
import { clipToAlpha, copySurface, flattenOnBlack } from './surface-ops.js';
import type { PaintEnv, Surface } from './surface.js';
import { transformLayer } from './transform-layer.js';

/** Moving with a selection lifts the selected pixels, transforms them, and drops them back. */
export function transformSelectedPixels(
  surface: Surface,
  selectionAlpha: Surface,
  cmd: CommandOf<'transform_layer'>,
  env: PaintEnv,
): void {
  const lifted = copySurface(surface, env);
  clipToAlpha(lifted, selectionAlpha, 'destination-in');
  clipToAlpha(surface, selectionAlpha, 'destination-out');
  transformLayer(lifted, cmd, env);
  surface.getContext('2d').drawImage(lifted, 0, 0);
}

/** Moves a grayscale mask or selection, keeping uncovered areas black. */
export function transformGray(gray: Surface, cmd: CommandOf<'transform_layer'>, env: PaintEnv): void {
  transformLayer(gray, cmd, env);
  flattenOnBlack(gray);
}
