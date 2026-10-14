import { z } from 'zod';

export const presetNameSchema = z
  .string()
  .max(60)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Use lowercase letters, digits and dashes, e.g. "ig-promo-post"');

/** A Google Fonts family by name, or a font file (URL or local path) with the family name to give it. */
const presetFontSchema = z.union([
  z.string().min(1),
  z.object({
    family: z.string().min(1),
    source: z.string().optional(),
    weights: z.array(z.string()).optional(),
  }),
]);

/** A reusable recipe for one kind of piece (a promo post, an event story...): format, brand and how to lay it out. */
export const presetSchema = z.object({
  name: presetNameSchema,
  description: z.string().min(1),
  instructions: z.string().min(1),
  canvas: z
    .object({
      width: z.number().int().min(1).max(8192),
      height: z.number().int().min(1).max(8192),
      background: z.string().default('#ffffff'),
    })
    .optional(),
  fonts: z.array(presetFontSchema).default([]),
  colors: z.record(z.string(), z.string()).default({}),
  assets: z.record(z.string(), z.string()).default({}),
});

export type Preset = z.infer<typeof presetSchema>;
export type PresetFont = Preset['fonts'][number];

export interface PresetSummary {
  name: string;
  description: string;
  hasTemplate: boolean;
  hasPreview: boolean;
}

export const DEFAULT_FONT_WEIGHTS = ['400', '700'];

/** Family, file and weights of a preset font, whichever way it was written. */
export function fontSpecOf(font: PresetFont): { family: string; source?: string; weights: string[] } {
  if (typeof font === 'string') return { family: font, weights: DEFAULT_FONT_WEIGHTS };
  return { family: font.family, source: font.source, weights: font.weights ?? DEFAULT_FONT_WEIGHTS };
}
