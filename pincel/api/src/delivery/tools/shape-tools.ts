import { z } from 'zod';
import { describeTarget, targetField } from './paint-target.js';
import { resolveLayer } from './resolve-layer.js';
import { defineTool } from './tool-definition.js';
import { layerIdField, pointField, rectField, shapeStyleFields } from './tool-fields.js';

const STYLE_HINT = 'Set fill and/or stroke; with neither, nothing is drawn.';

export const shapeTools = [
  defineTool({
    name: 'draw_rect',
    title: 'Rectangle',
    description: `Draws a (optionally rounded) rectangle. ${STYLE_HINT}`,
    input: {
      layerId: layerIdField,
      rect: rectField,
      radius: z.number().min(0).default(0).describe('Corner radius in pixels'),
      ...shapeStyleFields,
      target: targetField,
    },
    async run({ layerId, rect, radius, fill, stroke, strokeWidth, target }, { engine, source }) {
      const id = resolveLayer(engine, layerId);
      await engine.execute({ type: 'draw_rect', layerId: id, rect, radius, style: { fill, stroke, strokeWidth }, target }, source);
      return { text: `Drew rectangle on ${describeTarget(engine, id, target)}` };
    },
  }),

  defineTool({
    name: 'draw_ellipse',
    title: 'Ellipse',
    description: `Draws an ellipse or circle (radiusX = radiusY). ${STYLE_HINT}`,
    input: {
      layerId: layerIdField,
      center: pointField,
      radiusX: z.number().positive(),
      radiusY: z.number().positive(),
      ...shapeStyleFields,
      target: targetField,
    },
    async run({ layerId, center, radiusX, radiusY, fill, stroke, strokeWidth, target }, { engine, source }) {
      const id = resolveLayer(engine, layerId);
      const style = { fill, stroke, strokeWidth };
      await engine.execute({ type: 'draw_ellipse', layerId: id, center, radiusX, radiusY, style, target }, source);
      return { text: `Drew ellipse on ${describeTarget(engine, id, target)}` };
    },
  }),

  defineTool({
    name: 'draw_path',
    title: 'Line / polygon',
    description: `Straight segments through the points: a line (stroke only) or, with closed=true, a polygon. ${STYLE_HINT}`,
    input: {
      layerId: layerIdField,
      points: z.array(pointField).min(2),
      closed: z.boolean().default(false),
      ...shapeStyleFields,
      target: targetField,
    },
    async run({ layerId, points, closed, fill, stroke, strokeWidth, target }, { engine, source }) {
      const id = resolveLayer(engine, layerId);
      await engine.execute({ type: 'draw_path', layerId: id, points, closed, style: { fill, stroke, strokeWidth }, target }, source);
      return { text: `Drew ${closed ? 'polygon' : 'line'} with ${points.length} points on ${describeTarget(engine, id, target)}` };
    },
  }),
];
