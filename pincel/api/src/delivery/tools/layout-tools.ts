import { z } from 'zod';
import { resolveText } from './resolve-text.js';
import { alignField, textPlacementFields, textStyleFields } from './text-fields.js';
import { defineTool } from './tool-definition.js';

export const layoutTools = [
  defineTool({
    name: 'measure_text',
    title: 'Measure text',
    description:
      'Measures text without drawing it, with the same rules as draw_text. Give position or box to also get the box it would cover; with box (and fit="shrink") it returns the wrapped lines and the size that fits. height is the line box (lines x size x lineHeight); get_document bounds give the exact drawn pixels afterwards.',
    input: {
      text: z.string().min(1),
      ...textStyleFields,
      align: alignField,
      ...textPlacementFields,
    },
    readOnly: true,
    async run(input) {
      const placed = input.position || input.box;
      const resolved = resolveText(placed ? input : { ...input, position: [0, 0] });
      const data = {
        ...resolved.metrics,
        size: resolved.size,
        lines: resolved.text.split('\n'),
        box: placed ? resolved.box : undefined,
        notes: resolved.notes,
      };
      return { text: JSON.stringify(data), data };
    },
  }),
];
