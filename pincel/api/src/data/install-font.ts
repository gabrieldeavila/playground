import { groupFontFaces, type FontFamilySummary } from '../domain/fonts/group-font-faces.js';
import { fetchGoogleFont, readFontSource, type FontFile } from './font-source.js';
import type { FontStore } from './font-store.js';

export interface FontRequest {
  family: string;
  /** URL or local path of a font file; without it the family comes from Google Fonts. */
  source?: string;
  weights: string[];
}

/** Downloads or reads a font, registers it with the canvas and keeps it for next time. */
export async function installFont(fonts: FontStore, request: FontRequest): Promise<FontFamilySummary> {
  const files = request.source ? [await fileFace(request)] : await fetchGoogleFont(request.family, request.weights);
  const saved = await Promise.all(files.map(({ face, bytes }) => fonts.save(face, bytes)));
  return groupFontFaces(saved)[0];
}

async function fileFace({ family, source, weights }: FontRequest): Promise<FontFile> {
  return { face: { family, weight: weights[0], style: 'normal' }, bytes: await readFontSource(source!) };
}
