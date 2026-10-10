import { z } from 'zod';
import { pointField } from './tool-fields.js';

/** Font settings shared by draw_text and measure_text so measurements match what gets drawn. */
export const textStyleFields = {
  size: z.number().positive().default(48).describe('Font size in pixels (with fit="shrink", the largest size to try)'),
  font: z
    .string()
    .default('sans-serif')
    .describe('CSS font family list, e.g. "Bebas Neue, Impact, sans-serif". Use load_font first for Google Fonts or font files'),
  weight: z.enum(['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900']).default('normal'),
  letterSpacing: z.number().default(0).describe('Extra space between letters in pixels; negative tightens'),
  lineHeight: z.number().positive().default(1.2).describe('Distance between lines as a multiple of size; ~0.9-1 for stacked headlines'),
};

export const alignField = z.enum(['left', 'center', 'right']).default('left').describe('Horizontal anchor relative to position, or side of the box');

/** Where text goes: a free anchor point, or a box it wraps (and optionally shrinks) into. */
export const textPlacementFields = {
  position: pointField.optional().describe('Top edge of the first line, anchored per align. Give this or box'),
  box: z
    .object({ x: z.number(), y: z.number(), width: z.number().positive(), height: z.number().positive().optional() })
    .optional()
    .describe('Lay the text out inside this area: wraps to the width; align and verticalAlign place it in the box'),
  fit: z.enum(['none', 'shrink']).default('none').describe('With box: "shrink" uses the biggest size up to `size` that fits the box'),
  minSize: z.number().positive().default(8).describe('With fit="shrink": smallest size allowed'),
  verticalAlign: z.enum(['top', 'middle', 'bottom']).default('top').describe('With a box height: vertical position in the box'),
};
