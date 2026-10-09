import { z } from 'zod';

/** Font settings shared by draw_text and measure_text so measurements match what gets drawn. */
export const textStyleFields = {
  size: z.number().positive().default(48).describe('Font size in pixels'),
  font: z.string().default('sans-serif').describe('CSS font family, e.g. "Georgia", "Helvetica", "monospace"'),
  weight: z.enum(['normal', 'bold', '300', '500', '600', '800', '900']).default('normal'),
};

export const alignField = z.enum(['left', 'center', 'right']).default('left').describe('Horizontal anchor relative to position');
