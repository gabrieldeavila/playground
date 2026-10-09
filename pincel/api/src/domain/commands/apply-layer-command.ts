import { findLayer, insertLayer, layerIndex, moveLayer, newLayer, removeLayer, updateLayer } from '../document/layer-stack.js';
import type { LayerMeta } from '../document/types.js';
import { compositeLayer } from '../paint/composite.js';
import { copySurface } from '../paint/surface-ops.js';
import type { PaintEnv } from '../paint/surface.js';
import type { CommandOf } from './command-types.js';
import { surfaceOf, type DocState } from './doc-state.js';

export type LayerCommand = CommandOf<
  'add_layer' | 'delete_layer' | 'duplicate_layer' | 'update_layer' | 'reorder_layer' | 'merge_down'
>;

export function applyLayerCommand(state: DocState, cmd: LayerCommand, env: PaintEnv): DocState {
  switch (cmd.type) {
    case 'add_layer':
      return addLayer(state, cmd, env);
    case 'delete_layer':
      return deleteLayer(state, cmd.layerId);
    case 'duplicate_layer':
      return duplicateLayer(state, cmd, env);
    case 'update_layer':
      return { ...state, meta: updateLayer(state.meta, cmd.layerId, layerChanges(state, cmd)) };
    case 'reorder_layer':
      return { ...state, meta: moveLayer(state.meta, cmd.layerId, cmd.index) };
    case 'merge_down':
      return mergeDown(state, cmd.layerId, env);
  }
}

function layerChanges(state: DocState, cmd: CommandOf<'update_layer'>): Partial<Omit<LayerMeta, 'id'>> {
  const { maskEnabled, ...changes } = cmd.changes;
  if (maskEnabled === undefined) return changes;
  if (!findLayer(state.meta, cmd.layerId).mask) throw new Error(`Layer "${cmd.layerId}" has no mask`);
  return { ...changes, mask: { enabled: maskEnabled } };
}

function addLayer(state: DocState, cmd: CommandOf<'add_layer'>, env: PaintEnv): DocState {
  const surfaces = new Map(state.surfaces).set(cmd.layerId, env.createSurface(state.meta.width, state.meta.height));
  return { ...state, meta: insertLayer(state.meta, newLayer(cmd.layerId, cmd.name), cmd.index), surfaces };
}

function deleteLayer(state: DocState, layerId: string): DocState {
  if (state.meta.layers.length === 1) throw new Error('Cannot delete the only layer');
  const surfaces = new Map(state.surfaces);
  const masks = new Map(state.masks);
  surfaces.delete(layerId);
  masks.delete(layerId);
  return { ...state, meta: removeLayer(state.meta, layerId), surfaces, masks };
}

function duplicateLayer(state: DocState, cmd: CommandOf<'duplicate_layer'>, env: PaintEnv): DocState {
  const source = findLayer(state.meta, cmd.layerId);
  const surfaces = new Map(state.surfaces).set(cmd.newLayerId, copySurface(surfaceOf(state, cmd.layerId), env));
  const masks = new Map(state.masks);
  const mask = state.masks.get(cmd.layerId);
  if (mask) masks.set(cmd.newLayerId, copySurface(mask, env));
  const layer = { ...source, id: cmd.newLayerId, name: `${source.name} copy` };
  return { ...state, meta: insertLayer(state.meta, layer, layerIndex(state.meta, cmd.layerId) + 1), surfaces, masks };
}

/** Bakes the layer (with its opacity, blend mode and mask) into the one below and removes it. */
function mergeDown(state: DocState, layerId: string, env: PaintEnv): DocState {
  const index = layerIndex(state.meta, layerId);
  if (index === 0) throw new Error('There is no layer below to merge into');
  const below = state.meta.layers[index - 1];
  const target = surfaceOf(state, below.id).getContext('2d');
  compositeLayer(target, findLayer(state.meta, layerId), surfaceOf(state, layerId), state.masks.get(layerId), env);
  return deleteLayer(state, layerId);
}
