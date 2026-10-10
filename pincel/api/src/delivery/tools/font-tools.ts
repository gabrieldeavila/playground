import { z } from 'zod';
import { fetchGoogleFont, readFontSource, type FontFile } from '../../data/font-source.js';
import { groupFontFaces } from '../../domain/fonts/group-font-faces.js';
import { defineTool } from './tool-definition.js';

const WEIGHTS = ['100', '200', '300', '400', '500', '600', '700', '800', '900'] as const;

export const fontTools = [
  defineTool({
    name: 'load_font',
    title: 'Load font',
    description:
      'Installs a font so draw_text can use it: a Google Fonts family by name (e.g. "Bebas Neue", "Playfair Display", "Montserrat"), or a .ttf/.otf file from a URL or local path. Fonts stay installed across restarts. Then pass the family name as draw_text font.',
    input: {
      family: z.string().min(1).describe('Google Fonts family name, or the name to give the font file'),
      source: z.string().optional().describe('URL or local path of a font file; leave out to download from Google Fonts'),
      weights: z
        .array(z.enum(WEIGHTS))
        .min(1)
        .default(['400', '700'])
        .describe('Google Fonts: weights to download (only the ones the family has). Font file: the first is its weight'),
    },
    async run({ family, source, weights }, { fonts }) {
      const files = source ? [await fileFace(family, source, weights[0])] : await fetchGoogleFont(family, weights);
      const saved = await Promise.all(files.map(({ face, bytes }) => fonts.save(face, bytes)));
      const [loaded] = groupFontFaces(saved);
      const missing = weights.filter((weight) => !loaded.weights.includes(weight));
      const lines = [`Loaded ${loaded.family} (weights ${loaded.weights.join(', ')}). Use font: "${loaded.family}".`];
      if (!source && missing.length) lines.push(`It has no ${missing.join(', ')} weight; those draw with the nearest one.`);
      return { text: lines.join('\n'), data: loaded };
    },
  }),

  defineTool({
    name: 'list_fonts',
    title: 'List fonts',
    description: 'Fonts installed with load_font, with their weights. System fonts (Georgia, Helvetica, Impact, ...) work too.',
    input: {},
    readOnly: true,
    async run(_, { fonts }) {
      const families = groupFontFaces(await fonts.list());
      const text = families.length
        ? families.map((f) => `${f.family}: ${f.weights.join(', ')}`).join('\n')
        : 'No fonts loaded yet. Use load_font.';
      return { text, data: families };
    },
  }),
];

async function fileFace(family: string, source: string, weight: string): Promise<FontFile> {
  return { face: { family, weight, style: 'normal' }, bytes: await readFontSource(source) };
}
