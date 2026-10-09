import { useMemo } from 'react';
import type { ToolCall, ToolSettings } from '../domain/types';

/** Select-menu commands as ready-to-run tool calls on the active layer. */
export function useSelectionActions(run: (call: ToolCall) => void, layerId: string, settings: ToolSettings) {
  return useMemo(
    () => ({
      selectAll: () => run({ name: 'modify_selection', input: { action: 'select_all' } }),
      deselect: () => run({ name: 'modify_selection', input: { action: 'deselect' } }),
      invertSelection: () => run({ name: 'modify_selection', input: { action: 'invert' } }),
      featherSelection: (radius: number) => run({ name: 'modify_selection', input: { action: 'feather', radius } }),
      selectLayerPixels: () => run({ name: 'select_layer_pixels', input: { layerId } }),
      layerViaCopy: () => run({ name: 'copy_selection_to_layer', input: { layerId } }),
      layerViaCut: () => run({ name: 'copy_selection_to_layer', input: { layerId, cut: true } }),
      deletePixels: () =>
        run({ name: 'clear_layer', input: { layerId, ...(settings.target === 'mask' ? { target: 'mask' } : {}) } }),
    }),
    [run, layerId, settings.target],
  );
}

export type SelectionActions = ReturnType<typeof useSelectionActions>;
