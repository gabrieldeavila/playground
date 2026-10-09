import { z } from 'zod';
import type { Command } from '../../domain/commands/command-types.js';
import { nextLayerId } from '../../domain/document/layer-ids.js';
import { selectionBounds } from '../../data/selection-renderer.js';
import type { DocumentEngine } from '../../data/document-engine.js';
import { toleranceField } from './fill-tools.js';
import { resolveLayer } from './resolve-layer.js';
import { defineTool, type ToolContext } from './tool-definition.js';
import { layerIdField, pointField, rectField } from './tool-fields.js';

const modeField = z
  .enum(['replace', 'add', 'subtract', 'intersect'])
  .default('replace')
  .describe('How it combines with the current selection');

const featherField = z.number().min(0).max(250).default(0).describe('Soft edge width in pixels');

const SELECTION_HINT =
  'While a selection exists, every drawing tool, filter and clear only affects the selected area, and moving moves only the selected pixels. Use modify_selection {"action":"deselect"} when done.';

async function select(command: Command, { engine, source }: ToolContext) {
  await engine.execute(command, source);
  return { text: `Selection: ${describeSelection(engine)}`, data: { bounds: selectionBounds(engine.doc) } };
}

function describeSelection(engine: DocumentEngine): string {
  if (!engine.doc.selection) return 'none (whole layer is editable)';
  const bounds = selectionBounds(engine.doc);
  return bounds ? `bounds ${JSON.stringify(bounds)}` : 'empty (nothing can be edited until you change it)';
}

export const selectionTools = [
  defineTool({
    name: 'select_rect',
    title: 'Rectangular marquee',
    description: `Selects a rectangle. ${SELECTION_HINT}`,
    input: { rect: rectField, mode: modeField, feather: featherField },
    run: ({ rect, mode, feather }, ctx) =>
      select({ type: 'select_shape', shape: { kind: 'rect', rect }, mode, feather }, ctx),
  }),

  defineTool({
    name: 'select_ellipse',
    title: 'Elliptical marquee',
    description: `Selects an ellipse or circle. ${SELECTION_HINT}`,
    input: { center: pointField, radiusX: z.number().positive(), radiusY: z.number().positive(), mode: modeField, feather: featherField },
    run: ({ center, radiusX, radiusY, mode, feather }, ctx) =>
      select({ type: 'select_shape', shape: { kind: 'ellipse', center, radiusX, radiusY }, mode, feather }, ctx),
  }),

  defineTool({
    name: 'select_lasso',
    title: 'Lasso / polygon selection',
    description: `Selects the area inside a closed outline through the points. ${SELECTION_HINT}`,
    input: { points: z.array(pointField).min(3), mode: modeField, feather: featherField },
    run: ({ points, mode, feather }, ctx) =>
      select({ type: 'select_shape', shape: { kind: 'polygon', points }, mode, feather }, ctx),
  }),

  defineTool({
    name: 'select_color',
    title: 'Magic wand',
    description: `Selects the area of similar color around a point (e.g. a background, a sky, a solid shape). ${SELECTION_HINT}`,
    input: {
      point: pointField,
      tolerance: toleranceField,
      contiguous: z.boolean().default(true).describe('false = every similar pixel, connected or not'),
      layerId: z.string().optional().describe('Sample this layer; leave out to sample the visible image'),
      mode: modeField,
    },
    run: ({ point, tolerance, contiguous, layerId, mode }, ctx) =>
      select({ type: 'select_color', point, tolerance, contiguous, layerId, mode }, ctx),
  }),

  defineTool({
    name: 'select_layer_pixels',
    title: 'Select layer content',
    description: `Selects the visible pixels of a layer (its shape/silhouette), like Ctrl-clicking a layer thumbnail. ${SELECTION_HINT}`,
    input: { layerId: layerIdField, mode: modeField },
    run: ({ layerId, mode }, ctx) =>
      select({ type: 'select_layer_pixels', layerId: resolveLayer(ctx.engine, layerId), mode }, ctx),
  }),

  defineTool({
    name: 'modify_selection',
    title: 'Select all / deselect / invert / feather',
    description: 'select_all, deselect (back to editing whole layers), invert (select everything that was not selected), or feather (soften the edge by `radius` px).',
    input: {
      action: z.enum(['select_all', 'deselect', 'invert', 'feather']),
      radius: z.number().positive().default(4).describe('Only for feather'),
    },
    run: ({ action, radius }, ctx) => {
      const op = action === 'select_all' ? 'all' : action === 'deselect' ? 'none' : action;
      return select({ type: 'selection_op', op, amount: radius }, ctx);
    },
  }),

  defineTool({
    name: 'copy_selection_to_layer',
    title: 'Layer via copy / cut',
    description:
      'Copies (or with cut=true moves) the selected pixels of a layer onto a new layer right above it, which becomes active. Great for cutting out an object. Without a selection the whole layer is copied.',
    input: { layerId: layerIdField, cut: z.boolean().default(false) },
    async run({ layerId, cut }, { engine, source }) {
      const id = resolveLayer(engine, layerId);
      const newLayerId = nextLayerId(engine.doc.meta);
      await engine.execute({ type: 'copy_selection_to_layer', layerId: id, newLayerId, cut }, source);
      return { text: `${cut ? 'Cut' : 'Copied'} from ${id} to new layer ${newLayerId} (now active)`, data: { layerId: newLayerId } };
    },
  }),
];
