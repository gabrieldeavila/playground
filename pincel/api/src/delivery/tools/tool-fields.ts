import { z } from 'zod';
import { BLEND_MODES } from '../../domain/document/types.js';

/** Reusable input fields so every tool describes coordinates, colors and layers the same way. */
export const layerIdField = z
  .string()
  .optional()
  .describe('Target layer id (e.g. "layer_2"). Defaults to the active layer.');

export const colorField = (what: string) =>
  z.string().describe(`${what}: any CSS color, e.g. "#ff6600", "rgba(0,0,0,0.5)", "tomato"`);

export const pointField = z
  .tuple([z.number(), z.number()])
  .describe('[x, y] in canvas pixels, origin at the top-left');

export const rectField = z
  .object({ x: z.number(), y: z.number(), width: z.number().positive(), height: z.number().positive() })
  .describe('Rectangle in canvas pixels, origin at the top-left');

export const shapeStyleFields = {
  fill: colorField('Fill color').optional(),
  stroke: colorField('Outline color').optional(),
  strokeWidth: z.number().min(0).default(2).describe('Outline width in pixels'),
};

export const blendModeField = z.enum(BLEND_MODES).describe('Photoshop-style blend mode');
