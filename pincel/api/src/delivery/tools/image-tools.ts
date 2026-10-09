import { z } from 'zod';
import { resolveImageSource } from '../../data/image-source.js';
import { fitImage } from '../../domain/document/fit-image.js';
import { FILTER_NAMES, FILTERS } from '../../domain/filters/filter-catalog.js';
import { describeTarget, targetField } from './paint-target.js';
import { resolveLayer } from './resolve-layer.js';
import { defineTool } from './tool-definition.js';
import { layerIdField, rectField } from './tool-fields.js';

const filterHelp = FILTER_NAMES.map((name) => `${name} (${FILTERS[name].amountHint})`).join(', ');

export const imageTools = [
  defineTool({
    name: 'place_image',
    title: 'Place image',
    description:
      'Draws an image from an http(s) URL or data:image URI onto a layer. Without width/height it uses the natural size; one side keeps the aspect ratio; fit="contain"/"cover" fits it to the canvas.',
    input: {
      layerId: layerIdField,
      src: z.string().describe('https://... or data:image/png;base64,...'),
      x: z.number().optional(),
      y: z.number().optional(),
      width: z.number().positive().optional(),
      height: z.number().positive().optional(),
      fit: z.enum(['none', 'contain', 'cover']).default('none'),
      target: targetField,
    },
    async run({ layerId, src, target, ...placement }, { engine, source }) {
      const id = resolveLayer(engine, layerId);
      const image = await resolveImageSource(src);
      const rect = fitImage({ natural: image, canvas: engine.doc.meta, ...placement });
      await engine.execute({ type: 'place_image', layerId: id, src: image.dataUri, rect, target }, source);
      return { text: `Placed ${image.width}x${image.height} image on ${describeTarget(engine, id, target)} at ${JSON.stringify(rect)}` };
    },
  }),

  defineTool({
    name: 'apply_filter',
    title: 'Filter / adjustment',
    description: `Applies a filter to a layer, a rect of it, or the selection. On a mask, blur softens its edges. Filters and what amount means: ${filterHelp}.`,
    input: {
      layerId: layerIdField,
      filter: z.enum(FILTER_NAMES),
      amount: z.number().optional().describe('Leave out for a sensible default'),
      rect: rectField.optional(),
      target: targetField,
    },
    async run({ layerId, filter, amount, rect, target }, { engine, source }) {
      const id = resolveLayer(engine, layerId);
      const value = amount ?? FILTERS[filter].defaultAmount;
      await engine.execute({ type: 'apply_filter', layerId: id, filter, amount: value, rect, target }, source);
      return { text: `Applied ${filter} (${value}) to ${describeTarget(engine, id, target)}` };
    },
  }),

  defineTool({
    name: 'transform_layer',
    title: 'Move / transform',
    description:
      'Moves, scales, rotates (degrees, clockwise) or flips a layer\'s pixels around the canvas center. The layer mask moves along. With a selection, only the selected pixels move and the selection follows them.',
    input: {
      layerId: layerIdField,
      dx: z.number().default(0),
      dy: z.number().default(0),
      scale: z.number().positive().default(1),
      rotation: z.number().default(0),
      flipX: z.boolean().default(false),
      flipY: z.boolean().default(false),
      target: targetField,
    },
    async run({ layerId, ...transform }, { engine, source }) {
      const id = resolveLayer(engine, layerId);
      await engine.execute({ type: 'transform_layer', layerId: id, ...transform }, source);
      const moved = engine.doc.selection ? 'the selected pixels of ' : '';
      return { text: `Transformed ${moved}${transform.target === 'mask' ? `${id}'s mask` : id}` };
    },
  }),
];
