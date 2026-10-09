import { findLayer, updateLayer } from '../document/layer-stack.js';
import { clipToAlpha, copySurface, grayToAlpha, solidGray } from '../paint/surface-ops.js';
import type { PaintEnv, Surface } from '../paint/surface.js';
import type { CommandOf } from './command-types.js';
import { maskOf, surfaceOf, type DocState } from './doc-state.js';

export type MaskCommand = CommandOf<'add_layer_mask' | 'remove_layer_mask'>;

export function applyMaskCommand(state: DocState, cmd: MaskCommand, env: PaintEnv): DocState {
  return cmd.type === 'add_layer_mask' ? addMask(state, cmd, env) : removeMask(state, cmd, env);
}

function addMask(state: DocState, cmd: CommandOf<'add_layer_mask'>, env: PaintEnv): DocState {
  const layer = findLayer(state.meta, cmd.layerId);
  if (layer.mask) throw new Error(`Layer "${cmd.layerId}" already has a mask`);
  const masks = new Map(state.masks).set(cmd.layerId, initialMask(state, cmd.from, env));
  return { ...state, masks, meta: updateLayer(state.meta, cmd.layerId, { mask: { enabled: true } }) };
}

function initialMask(state: DocState, from: CommandOf<'add_layer_mask'>['from'], env: PaintEnv): Surface {
  const { width, height } = state.meta;
  if (from === 'selection' && state.selection) return copySurface(state.selection, env);
  return solidGray(width, height, from !== 'hide_all', env);
}

/** Deletes the mask; with `apply` its effect is baked into the layer's pixels first. */
function removeMask(state: DocState, cmd: CommandOf<'remove_layer_mask'>, env: PaintEnv): DocState {
  const mask = maskOf(state, cmd.layerId);
  if (cmd.apply) clipToAlpha(surfaceOf(state, cmd.layerId), grayToAlpha(mask, env), 'destination-in');
  const masks = new Map(state.masks);
  masks.delete(cmd.layerId);
  return { ...state, masks, meta: updateLayer(state.meta, cmd.layerId, { mask: null }) };
}
