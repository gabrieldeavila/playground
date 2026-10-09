import type { CommandOf } from '../commands/command-types.js';
import { surfaceOf, type DocState } from '../commands/doc-state.js';
import { findLayer } from '../document/layer-stack.js';
import { visiblePixels } from '../paint/composite.js';
import { renderComposite } from '../paint/render-composite.js';
import { solidGray } from '../paint/surface-ops.js';
import type { PaintEnv, Surface } from '../paint/surface.js';
import {
  combineSelection,
  coverageSelection,
  featherGray,
  invertedGray,
  shapeSelection,
} from './build-selection.js';
import { floodRegion } from './flood-region.js';
import { alphaCoverage } from './mask-alpha.js';

export type SelectionCommand = CommandOf<'select_shape' | 'select_color' | 'select_layer_pixels' | 'selection_op'>;

export function applySelectionCommand(state: DocState, cmd: SelectionCommand, env: PaintEnv): DocState {
  const { width, height } = state.meta;
  switch (cmd.type) {
    case 'select_shape': {
      const shape = featherGray(shapeSelection(cmd.shape, width, height, env), cmd.feather, env);
      return withSelection(state, combineSelection(state.selection, shape, cmd.mode, env));
    }
    case 'select_color': {
      const region = colorRegion(state, cmd, env);
      return withSelection(state, combineSelection(state.selection, region, cmd.mode, env));
    }
    case 'select_layer_pixels': {
      const layer = findLayer(state.meta, cmd.layerId);
      const visible = visiblePixels(layer, surfaceOf(state, cmd.layerId), state.masks.get(cmd.layerId), env);
      const coverage = alphaCoverage(imageOf(visible));
      const region = coverageSelection(coverage, width, height, env);
      return withSelection(state, combineSelection(state.selection, region, cmd.mode, env));
    }
    case 'selection_op':
      return withSelection(state, selectionOp(state, cmd, env));
  }
}

function colorRegion(state: DocState, cmd: CommandOf<'select_color'>, env: PaintEnv): Surface {
  const source = cmd.layerId ? surfaceOf(state, cmd.layerId) : renderComposite(state, env);
  const region = floodRegion(imageOf(source), cmd.point[0], cmd.point[1], cmd.tolerance, cmd.contiguous);
  return coverageSelection(region, state.meta.width, state.meta.height, env);
}

function selectionOp(state: DocState, cmd: CommandOf<'selection_op'>, env: PaintEnv): Surface | null {
  const { width, height } = state.meta;
  if (cmd.op === 'all') return solidGray(width, height, true, env);
  if (cmd.op === 'none' || !state.selection) return null;
  if (cmd.op === 'invert') return invertedGray(state.selection, env);
  return featherGray(state.selection, cmd.amount ?? 4, env);
}

function withSelection(state: DocState, selection: Surface | null): DocState {
  return { ...state, selection };
}

function imageOf(surface: Surface) {
  return surface.getContext('2d').getImageData(0, 0, surface.width, surface.height);
}
