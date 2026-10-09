import { z } from 'zod';
import { describeTarget, targetField } from './paint-target.js';
import { resolveLayer } from './resolve-layer.js';
import { defineTool } from './tool-definition.js';
import { colorField, layerIdField, pointField, rectField } from './tool-fields.js';

export const toleranceField = z
  .number()
  .min(0)
  .max(255)
  .default(32)
  .describe('How different a color may be (per channel, 0..255) and still count as similar');

export const fillTools = [
  defineTool({
    name: 'flood_fill',
    title: 'Paint bucket',
    description: 'Fills the area of similar color around a point, like Photoshop\'s paint bucket.',
    input: {
      layerId: layerIdField,
      point: pointField,
      color: colorField('Fill color'),
      tolerance: toleranceField,
      contiguous: z.boolean().default(true).describe('false = every similar pixel in the layer, connected or not'),
      sampleAllLayers: z.boolean().default(false).describe('Decide the area from the visible image instead of this layer'),
      target: targetField,
    },
    async run({ layerId, ...fill }, { engine, source }) {
      const id = resolveLayer(engine, layerId);
      await engine.execute({ type: 'flood_fill', layerId: id, ...fill }, source);
      return { text: `Filled around ${JSON.stringify(fill.point)} with ${fill.color} on ${describeTarget(engine, id, fill.target)}` };
    },
  }),

  defineTool({
    name: 'fill_layer',
    title: 'Fill layer',
    description: 'Fills the entire layer (or just the selection) with one color.',
    input: { layerId: layerIdField, color: colorField('Fill color'), target: targetField },
    async run({ layerId, color, target }, { engine, source }) {
      const id = resolveLayer(engine, layerId);
      await engine.execute({ type: 'fill_layer', layerId: id, color, target }, source);
      return { text: `Filled ${describeTarget(engine, id, target)} with ${color}` };
    },
  }),

  defineTool({
    name: 'clear_layer',
    title: 'Clear / delete pixels',
    description: 'Makes the layer transparent: everything, a rect, or (with an active selection) just the selected pixels.',
    input: { layerId: layerIdField, rect: rectField.optional(), target: targetField },
    async run({ layerId, rect, target }, { engine, source }) {
      const id = resolveLayer(engine, layerId);
      await engine.execute({ type: 'clear_layer', layerId: id, rect, target }, source);
      return { text: `Cleared ${rect ? 'area of ' : ''}${describeTarget(engine, id, target)}` };
    },
  }),
];
