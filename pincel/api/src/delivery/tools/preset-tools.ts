import { type DocumentTemplate, loadTemplate } from '../../data/document-template.js';
import { installPresetFonts } from '../../data/install-preset-fonts.js';
import type { DocumentEngine } from '../../data/document-engine.js';
import type { CommandSource } from '../../data/logged-command.js';
import { type AppliedPreset, presetBrief } from '../../domain/presets/preset-brief.js';
import { presetNameSchema, type Preset } from '../../domain/presets/preset.js';
import { defineTool } from './tool-definition.js';

export const presetTools = [
  defineTool({
    name: 'list_presets',
    title: 'List presets',
    description:
      'Saved presets: recipes for a kind of piece (a promo post, an event story...) with canvas size, fonts, colors, assets like the logo, and layout instructions. When a request matches one, apply_preset it first.',
    input: {},
    readOnly: true,
    async run(_, { presets }) {
      const all = await presets.list();
      const text = all.length
        ? all.map((p) => `${p.name}: ${p.description}${p.hasTemplate ? ' (has a template document)' : ''}`).join('\n')
        : 'No presets yet. save_preset creates one.';
      return { text, data: all };
    },
  }),

  defineTool({
    name: 'apply_preset',
    title: 'Apply preset',
    description:
      'Starts a piece from a preset: loads its fonts, opens its template document or a blank canvas of its size (replacing the current document), and returns its colors, assets and instructions to follow. Bring photos in afterwards with place_image path.',
    input: { name: presetNameSchema },
    async run({ name }, { engine, fonts, presets, source }) {
      const { preset, template } = await presets.load(name);
      const { ready, warnings } = await installPresetFonts(fonts, preset.fonts);
      const document = await startDocument(engine, preset, template, source);
      const applied: AppliedPreset = { preset, document, ...engine.doc.meta, fonts: ready, warnings };
      return { text: presetBrief(applied), data: { preset, document } };
    },
  }),

  defineTool({
    name: 'delete_preset',
    title: 'Delete preset',
    description: 'Deletes a saved preset (and its template document). Only when the person asks for it.',
    input: { name: presetNameSchema },
    async run({ name }, { presets }) {
      await presets.remove(name);
      return { text: `Deleted preset "${name}"` };
    },
  }),
];

async function startDocument(
  engine: DocumentEngine,
  preset: Preset,
  template: DocumentTemplate | null,
  source: CommandSource,
): Promise<AppliedPreset['document']> {
  if (template) {
    await loadTemplate(engine, template, `preset ${preset.name}`, source);
    return 'template';
  }
  if (!preset.canvas) return 'unchanged';
  await engine.reset(preset.canvas, source);
  return 'canvas';
}
