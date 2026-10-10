import { z } from 'zod';
import { describeTarget, targetField } from './paint-target.js';
import { resolveLayer } from './resolve-layer.js';
import { resolveText } from './resolve-text.js';
import { alignField, textPlacementFields, textStyleFields } from './text-fields.js';
import { defineTool } from './tool-definition.js';
import { colorField, layerIdField } from './tool-fields.js';

export const textTools = [
  defineTool({
    name: 'draw_text',
    title: 'Text',
    description:
      'Writes text, either at a position (top edge, \\n for line breaks) or inside a box that wraps it and, with fit="shrink", sizes it to fill the box. Supports letter spacing, line height, an outline and rotation. Returns the box it covers (before rotation) and the final size.',
    input: {
      layerId: layerIdField,
      text: z.string().min(1),
      color: colorField('Text color').default('#000000'),
      ...textStyleFields,
      align: alignField,
      ...textPlacementFields,
      stroke: colorField('Outline color, drawn outside the letters').optional(),
      strokeWidth: z.number().min(0).default(4).describe('Outline width in pixels (only with stroke)'),
      rotation: z.number().default(0).describe('Degrees clockwise around the text anchor'),
      target: targetField,
    },
    async run(input, { engine, source }) {
      const id = resolveLayer(engine, input.layerId);
      const resolved = resolveText(input);
      const { color, font, weight, align, letterSpacing, lineHeight, stroke, rotation, target } = input;
      const strokeWidth = stroke ? input.strokeWidth : undefined;
      await engine.execute(
        {
          type: 'draw_text',
          layerId: id,
          text: resolved.text,
          position: resolved.position,
          size: resolved.size,
          ...{ color, font, weight, align, letterSpacing, lineHeight, stroke, strokeWidth, rotation, target },
        },
        source,
      );
      const summary = `Wrote "${input.text.slice(0, 40)}" at ${resolved.size}px on ${describeTarget(engine, id, target)}, covering ${JSON.stringify(resolved.box)}`;
      const data = { box: resolved.box, size: resolved.size, lines: resolved.text.split('\n'), notes: resolved.notes };
      return { text: [summary, ...resolved.notes].join('\n'), data };
    },
  }),
];
