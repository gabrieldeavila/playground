import { z } from 'zod';
import { templateOf } from '../../data/document-template.js';
import { savePresetPreview } from '../../data/preset-preview.js';
import { presetNameSchema, presetSchema } from '../../domain/presets/preset.js';
import { defineTool } from './tool-definition.js';

export const savePresetTool = defineTool({
  name: 'save_preset',
  title: 'Save preset',
  description:
    'Saves a preset to reuse for a kind of piece. Write instructions as a recipe someone could follow with a different photo and text: layout, sizes, positions, font roles, effects. includeDocument keeps the current document as the template to start from (remove one-off content such as the product photo first, unless it should be in every piece).',
  input: {
    name: presetNameSchema,
    description: z.string().min(1).describe('One line: what kind of piece this is for'),
    instructions: z.string().min(1).describe('How to build the piece, step by step'),
    canvas: presetSchema.shape.canvas.describe('Size and background for a blank start; leave out with includeDocument'),
    fonts: z
      .array(z.string())
      .default([])
      .describe('Google Fonts families (or fonts already loaded with load_font) the piece uses'),
    colors: presetSchema.shape.colors.describe('Named brand colors, e.g. {"primary": "#e63946"}'),
    assets: presetSchema.shape.assets.describe('Named files used in every piece, e.g. {"logo": "~/brand/logo.png"}'),
    includeDocument: z.boolean().default(false),
    overwrite: z.boolean().default(false).describe('Replace a preset with the same name'),
  },
  async run({ includeDocument, overwrite, ...fields }, { engine, presets }) {
    const preset = presetSchema.parse(fields);
    const template = includeDocument ? templateOf(engine) : null;
    await presets.save({ preset, template }, overwrite);
    await savePresetPreview(presets, preset.name, engine.doc);
    const kept = template ? ` with the current ${template.setup.width}x${template.setup.height} document as its template` : '';
    return { text: `Saved preset "${preset.name}"${kept}. apply_preset uses it.`, data: preset };
  },
});
