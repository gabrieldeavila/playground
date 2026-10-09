import type { PaintEnv } from '../paint/surface.js';
import { applySelectionCommand, type SelectionCommand } from '../selection/apply-selection-command.js';
import { applyLayerCommand, type LayerCommand } from './apply-layer-command.js';
import { applyMaskCommand, type MaskCommand } from './apply-mask-command.js';
import { applyPaintCommand, type PaintCommand } from './apply-paint-command.js';
import type { Command, CommandType } from './command-types.js';
import type { DocState } from './doc-state.js';
import { layerViaCopy } from './layer-via-copy.js';
import { resizeCanvas } from './resize-canvas.js';

const LAYER_COMMANDS = new Set<CommandType>([
  'add_layer',
  'delete_layer',
  'duplicate_layer',
  'update_layer',
  'reorder_layer',
  'merge_down',
]);
const SELECTION_COMMANDS = new Set<CommandType>(['select_shape', 'select_color', 'select_layer_pixels', 'selection_op']);
const MASK_COMMANDS = new Set<CommandType>(['add_layer_mask', 'remove_layer_mask']);

export async function applyCommand(state: DocState, cmd: Command, env: PaintEnv): Promise<DocState> {
  if (cmd.type === 'resize_canvas') return resizeCanvas(state, cmd, env);
  if (cmd.type === 'copy_selection_to_layer') return layerViaCopy(state, cmd, env);
  if (LAYER_COMMANDS.has(cmd.type)) return applyLayerCommand(state, cmd as LayerCommand, env);
  if (SELECTION_COMMANDS.has(cmd.type)) return applySelectionCommand(state, cmd as SelectionCommand, env);
  if (MASK_COMMANDS.has(cmd.type)) return applyMaskCommand(state, cmd as MaskCommand, env);
  return applyPaintCommand(state, cmd as PaintCommand, env);
}
