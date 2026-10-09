import { z } from 'zod';
import { renderPng, sampleColor } from '../../data/document-renderer.js';
import { describeDocument } from './describe-document.js';
import { defineTool } from './tool-definition.js';
import { colorField, rectField } from './tool-fields.js';

export const documentTools = [
  defineTool({
    name: 'get_document',
    title: 'Get document',
    description:
      'Size, layers (bottom to top) with opacity/visibility/blend mode and `bounds` (where their visible pixels are; null = empty), the active layer and recent edits.',
    input: {},
    readOnly: true,
    async run(_, { engine }) {
      const data = describeDocument(engine, { withBounds: true });
      return { text: JSON.stringify(data, null, 2), data };
    },
  }),

  defineTool({
    name: 'render_image',
    title: 'Look at the image',
    description:
      'Returns the current image as a PNG so you can see your work. Call it after a few edits to check the result. Use grid=true to overlay labelled coordinate lines when you need to place things precisely, and region to zoom in on a detail (small regions are enlarged up to 8x to fill maxSize).',
    input: {
      layerId: z.string().optional().describe('Render only this layer instead of the full composite'),
      maxSize: z.number().int().min(64).max(4096).default(1024).describe('Longest side of the returned image'),
      grid: z
        .union([z.boolean(), z.number().int().min(5)])
        .default(false)
        .describe('true = labelled grid lines in document pixels; a number sets the spacing'),
      region: rectField.optional().describe('Only render this part of the document'),
    },
    readOnly: true,
    async run({ layerId, maxSize, grid, region }, { engine }) {
      const image = renderPng(engine.doc, { layerId, maxSize, grid, region });
      const area = region ? `region ${JSON.stringify(region)}` : `${engine.doc.meta.width}x${engine.doc.meta.height}`;
      return { text: `Rendered ${layerId ?? 'composite'} (${area})${grid ? ' with grid' : ''}`, image };
    },
  }),

  defineTool({
    name: 'sample_color',
    title: 'Eyedropper',
    description: 'Reads the color at a pixel, from the composite or from one layer. Returns #rrggbb or #rrggbbaa.',
    input: { x: z.number(), y: z.number(), layerId: z.string().optional() },
    readOnly: true,
    async run({ x, y, layerId }, { engine }) {
      const color = sampleColor(engine.doc, x, y, layerId);
      return { text: color, data: { color } };
    },
  }),

  defineTool({
    name: 'create_document',
    title: 'New document',
    description: 'Discards the current image and history and starts a new one with a single Background layer.',
    input: {
      width: z.number().int().min(1).max(8192),
      height: z.number().int().min(1).max(8192),
      background: colorField('Background color, or "transparent"').default('#ffffff'),
    },
    async run(setup, { engine, source }) {
      await engine.reset(setup, source);
      return { text: `New ${setup.width}x${setup.height} document. Active layer: ${engine.activeLayer}` };
    },
  }),

  defineTool({
    name: 'resize_canvas',
    title: 'Crop / resize canvas',
    description:
      'Changes the canvas size without scaling pixels (crop or extend). offsetX/offsetY say where the old top-left lands, e.g. to crop to x=100,y=50 use offsetX=-100, offsetY=-50.',
    input: {
      width: z.number().int().min(1).max(8192),
      height: z.number().int().min(1).max(8192),
      offsetX: z.number().default(0),
      offsetY: z.number().default(0),
    },
    async run(input, { engine, source }) {
      await engine.execute({ type: 'resize_canvas', ...input }, source);
      return { text: `Canvas is now ${input.width}x${input.height}` };
    },
  }),
];

