import type { CommandOf } from '../commands/command-types.js';
import { maskOf, surfaceOf, type DocState } from '../commands/doc-state.js';
import { flattenOnBlack, grayToAlpha } from './surface-ops.js';
import type { PaintEnv, Surface } from './surface.js';
import { transformGray, transformSelectedPixels } from './transform-selection.js';
import { transformLayer } from './transform-layer.js';

/**
 * Move/scale/rotate. Like Photoshop: the layer's mask moves with its pixels,
 * a selection limits what moves, and the selection follows what was moved.
 */
export function applyTransform(state: DocState, cmd: CommandOf<'transform_layer'>, env: PaintEnv): void {
  const selectionAlpha = state.selection ? grayToAlpha(state.selection, env) : null;
  const move = (surface: Surface, gray: boolean) => {
    if (selectionAlpha) transformSelectedPixels(surface, selectionAlpha, cmd, env);
    else if (gray) transformGray(surface, cmd, env);
    else transformLayer(surface, cmd, env);
    if (gray) flattenOnBlack(surface);
  };

  if (cmd.target === 'mask') {
    move(maskOf(state, cmd.layerId), true);
  } else {
    move(surfaceOf(state, cmd.layerId), false);
    const mask = state.masks.get(cmd.layerId);
    if (mask) move(mask, true);
  }
  if (state.selection) transformGray(state.selection, cmd, env);
}
