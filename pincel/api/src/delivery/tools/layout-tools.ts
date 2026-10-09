import { z } from 'zod';
import { measureText } from '../../data/measure-text.js';
import { textBox } from '../../domain/paint/text-layout.js';
import { defineTool } from './tool-definition.js';
import { alignField, textStyleFields } from './text-fields.js';
import { pointField } from './tool-fields.js';

export const layoutTools = [
  defineTool({
    name: 'measure_text',
    title: 'Measure text',
    description:
      'Measures text without drawing it, using the same font rules as draw_text. Pass position/align to also get the box it would cover. Use it to center text, fit it to a width, or stack lines. height is the line box (lines × size × 1.2); get_document bounds give the exact drawn pixels afterwards.',
    input: {
      text: z.string().min(1),
      ...textStyleFields,
      position: pointField.optional(),
      align: alignField,
    },
    readOnly: true,
    async run({ text, size, font, weight, position, align }) {
      const metrics = measureText(text, size, font, weight);
      const box = position ? textBox(position, align, metrics.width, metrics.lineWidths.length, size) : undefined;
      const data = { ...metrics, box };
      return { text: JSON.stringify(data), data };
    },
  }),
];
