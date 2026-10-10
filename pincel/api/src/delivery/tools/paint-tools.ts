import { z } from 'zod';
import { describeTarget, targetField } from './paint-target.js';
import { resolveLayer } from './resolve-layer.js';
import { defineTool } from './tool-definition.js';
import { colorField, layerIdField, pointField, rectField } from './tool-fields.js';

export const paintTools = [
  defineTool({
    name: 'brush_stroke',
    title: 'Brush / eraser',
    description: 'Freehand round-brush stroke through the points (smoothed). erase=true turns it into an eraser.',
    input: {
      layerId: layerIdField,
      points: z.array(pointField).min(1),
      color: colorField('Brush color').default('#000000'),
      size: z.number().positive().default(12).describe('Brush diameter in pixels'),
      opacity: z.number().min(0).max(1).default(1),
      erase: z.boolean().default(false),
      target: targetField,
    },
    async run({ layerId, ...brush }, { engine, source }) {
      const id = resolveLayer(engine, layerId);
      await engine.execute({ type: 'brush_stroke', layerId: id, ...brush }, source);
      return { text: `${brush.erase ? 'Erased' : 'Painted'} ${brush.points.length} points on ${describeTarget(engine, id, brush.target)}` };
    },
  }),

  defineTool({
    name: 'draw_gradient',
    title: 'Gradient',
    description:
      'Fills the layer (or a rect) with a gradient. linear: from→to sets the direction. radial: from is the center, distance to `to` is the radius. On a mask, a black→white gradient makes a smooth fade.',
    input: {
      layerId: layerIdField,
      kind: z.enum(['linear', 'radial']).default('linear'),
      from: pointField,
      to: pointField,
      stops: z
        .array(z.object({ offset: z.number().min(0).max(1), color: colorField('Stop color') }))
        .min(2)
        .describe('Color stops, offset 0..1'),
      rect: rectField.optional(),
      target: targetField,
    },
    async run({ layerId, ...gradient }, { engine, source }) {
      const id = resolveLayer(engine, layerId);
      await engine.execute({ type: 'draw_gradient', layerId: id, ...gradient }, source);
      return { text: `Drew ${gradient.kind} gradient on ${describeTarget(engine, id, gradient.target)}` };
    },
  }),
];
