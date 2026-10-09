import { z } from 'zod';
import { nextLayerId } from '../../domain/document/layer-ids.js';
import { layerIndex } from '../../domain/document/layer-stack.js';
import { resolveLayer } from './resolve-layer.js';
import { defineTool } from './tool-definition.js';
import { blendModeField, layerIdField } from './tool-fields.js';

export const layerTools = [
  defineTool({
    name: 'add_layer',
    title: 'New layer',
    description: 'Adds an empty transparent layer above the active one and makes it active. Returns its id.',
    input: { name: z.string().default('Layer') },
    async run({ name }, { engine, source }) {
      const layerId = nextLayerId(engine.doc.meta);
      const index = layerIndex(engine.doc.meta, engine.activeLayer) + 1;
      await engine.execute({ type: 'add_layer', layerId, name, index }, source);
      return { text: `Added "${name}" as ${layerId} (now active)`, data: { layerId } };
    },
  }),

  defineTool({
    name: 'select_layer',
    title: 'Select layer',
    description: 'Makes a layer active; tools without a layerId draw on the active layer.',
    input: { layerId: z.string() },
    async run({ layerId }, { engine }) {
      await engine.selectLayer(layerId);
      return { text: `Active layer: ${layerId}` };
    },
  }),

  defineTool({
    name: 'update_layer',
    title: 'Layer properties',
    description: 'Renames a layer or changes its visibility, opacity (0..1), blend mode, or turns its mask on/off.',
    input: {
      layerId: layerIdField,
      name: z.string().optional(),
      visible: z.boolean().optional(),
      opacity: z.number().min(0).max(1).optional(),
      blendMode: blendModeField.optional(),
      maskEnabled: z.boolean().optional().describe('Only for layers with a mask'),
    },
    async run({ layerId, ...changes }, { engine, source }) {
      const id = resolveLayer(engine, layerId);
      await engine.execute({ type: 'update_layer', layerId: id, changes }, source);
      return { text: `Updated ${id}: ${JSON.stringify(changes)}` };
    },
  }),

  defineTool({
    name: 'reorder_layer',
    title: 'Move layer in stack',
    description: 'Moves a layer to a stack position: 0 is the bottom, higher numbers are on top.',
    input: { layerId: layerIdField, index: z.number().int().min(0) },
    async run({ layerId, index }, { engine, source }) {
      const id = resolveLayer(engine, layerId);
      await engine.execute({ type: 'reorder_layer', layerId: id, index }, source);
      return { text: `Moved ${id} to position ${index}` };
    },
  }),

  defineTool({
    name: 'duplicate_layer',
    title: 'Duplicate layer',
    description: 'Copies a layer (pixels and properties) right above itself and makes the copy active.',
    input: { layerId: layerIdField },
    async run({ layerId }, { engine, source }) {
      const id = resolveLayer(engine, layerId);
      const newLayerId = nextLayerId(engine.doc.meta);
      await engine.execute({ type: 'duplicate_layer', layerId: id, newLayerId }, source);
      return { text: `Duplicated ${id} as ${newLayerId}`, data: { layerId: newLayerId } };
    },
  }),

  defineTool({
    name: 'stamp_visible',
    title: 'Stamp visible',
    description:
      'Adds a new top layer with the flattened image (everything visible), keeping all layers underneath. Use it before liquify or other edits that must affect the whole look at once.',
    input: { name: z.string().default('Stamp') },
    async run({ name }, { engine, source }) {
      const newLayerId = nextLayerId(engine.doc.meta);
      await engine.execute({ type: 'stamp_visible', newLayerId, name }, source);
      return { text: `Stamped the visible image to ${newLayerId} "${name}" (now active, on top)`, data: { layerId: newLayerId } };
    },
  }),

  defineTool({
    name: 'merge_down',
    title: 'Merge down',
    description: 'Flattens a layer (with its opacity and blend mode) into the layer below it.',
    input: { layerId: layerIdField },
    async run({ layerId }, { engine, source }) {
      const id = resolveLayer(engine, layerId);
      await engine.execute({ type: 'merge_down', layerId: id }, source);
      return { text: `Merged ${id} down` };
    },
  }),

  defineTool({
    name: 'delete_layer',
    title: 'Delete layer',
    description: 'Removes a layer. The last remaining layer cannot be deleted.',
    input: { layerId: layerIdField },
    async run({ layerId }, { engine, source }) {
      const id = resolveLayer(engine, layerId);
      await engine.execute({ type: 'delete_layer', layerId: id }, source);
      return { text: `Deleted ${id}` };
    },
  }),
];
