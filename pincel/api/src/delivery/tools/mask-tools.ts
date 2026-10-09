import { z } from 'zod';
import { resolveLayer } from './resolve-layer.js';
import { defineTool } from './tool-definition.js';
import { layerIdField } from './tool-fields.js';

export const maskTools = [
  defineTool({
    name: 'add_layer_mask',
    title: 'Add layer mask',
    description:
      'Adds a grayscale mask to a layer: white shows the layer, black hides it, grays are partial. Non-destructive: paint on it with any drawing tool using target:"mask" (e.g. a black→white draw_gradient for a fade, apply_filter blur for a soft edge). Turn it off with update_layer maskEnabled:false.',
    input: {
      layerId: layerIdField,
      from: z
        .enum(['selection', 'reveal_all', 'hide_all'])
        .optional()
        .describe('Start from the current selection (default when there is one), all white, or all black'),
    },
    async run({ layerId, from }, { engine, source }) {
      const id = resolveLayer(engine, layerId);
      const start = from ?? (engine.doc.selection ? 'selection' : 'reveal_all');
      await engine.execute({ type: 'add_layer_mask', layerId: id, from: start }, source);
      return { text: `Added mask to ${id} (from ${start}). Paint on it with target:"mask".` };
    },
  }),

  defineTool({
    name: 'remove_layer_mask',
    title: 'Remove layer mask',
    description: 'Deletes a layer\'s mask. apply=true first bakes it in (hidden pixels are erased); apply=false just discards it.',
    input: { layerId: layerIdField, apply: z.boolean().default(false) },
    async run({ layerId, apply }, { engine, source }) {
      const id = resolveLayer(engine, layerId);
      await engine.execute({ type: 'remove_layer_mask', layerId: id, apply }, source);
      return { text: `${apply ? 'Applied and removed' : 'Removed'} the mask of ${id}` };
    },
  }),
];
