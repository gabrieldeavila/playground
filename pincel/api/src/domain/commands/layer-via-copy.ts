import { findLayer, insertLayer, layerIndex, newLayer } from '../document/layer-stack.js';
import { clipToAlpha, copySurface, grayToAlpha } from '../paint/surface-ops.js';
import type { PaintEnv } from '../paint/surface.js';
import type { CommandOf } from './command-types.js';
import { surfaceOf, type DocState } from './doc-state.js';

/** Photoshop's "Layer via Copy/Cut": the selected pixels go to a new layer right above. */
export function layerViaCopy(state: DocState, cmd: CommandOf<'copy_selection_to_layer'>, env: PaintEnv): DocState {
  const source = findLayer(state.meta, cmd.layerId);
  const pixels = surfaceOf(state, cmd.layerId);
  const copy = copySurface(pixels, env);
  if (state.selection) {
    const selected = grayToAlpha(state.selection, env);
    clipToAlpha(copy, selected, 'destination-in');
    if (cmd.cut) clipToAlpha(pixels, selected, 'destination-out');
  } else if (cmd.cut) {
    pixels.getContext('2d').clearRect(0, 0, pixels.width, pixels.height);
  }
  const layer = newLayer(cmd.newLayerId, `${source.name} (${cmd.cut ? 'cut' : 'copy'})`);
  return {
    ...state,
    surfaces: new Map(state.surfaces).set(cmd.newLayerId, copy),
    meta: insertLayer(state.meta, layer, layerIndex(state.meta, cmd.layerId) + 1),
  };
}
