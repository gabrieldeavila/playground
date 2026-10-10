import { readFile, stat } from 'node:fs/promises';
import { homedir } from 'node:os';
import { extname, resolve } from 'node:path';
import { parseFontFaceCss } from '../domain/fonts/parse-font-face-css.js';
import type { FontFaceInfo } from './font-store.js';

const MAX_BYTES = 10 * 1024 * 1024;
const FONT_EXTENSIONS = ['.ttf', '.otf', '.woff', '.woff2'];

export interface FontFile {
  face: FontFaceInfo;
  bytes: Buffer;
}

/** Downloads a Google Fonts family (as TrueType) in the weights it has among the ones asked for. */
export async function fetchGoogleFont(family: string, weights: string[]): Promise<FontFile[]> {
  const css = await fetchGoogleCss(family, weights);
  const faces = parseFontFaceCss(css);
  if (faces.length === 0) throw new Error(`Google Fonts returned no files for "${family}"`);
  return Promise.all(faces.map(async ({ url, ...face }) => ({ face, bytes: await download(url) })));
}

/** A font file from an http(s) URL or a local path. */
export async function readFontSource(src: string): Promise<Buffer> {
  if (/^https?:\/\//.test(src)) return download(src);
  const fullPath = resolve(src.replace(/^~(?=$|\/)/, homedir()));
  if (!FONT_EXTENSIONS.includes(extname(fullPath).toLowerCase())) throw new Error('Font file must be .ttf, .otf, .woff or .woff2');
  if ((await stat(fullPath)).size > MAX_BYTES) throw new Error('Font file is larger than 10 MB');
  return readFile(fullPath);
}

async function fetchGoogleCss(family: string, weights: string[]): Promise<string> {
  const name = encodeURIComponent(family).replace(/%20/g, '+');
  const sorted = [...weights].sort((a, b) => Number(a) - Number(b));
  // Static families reject weights they don't have, so fall back to the family's default.
  for (const query of [`${name}:wght@${sorted.join(';')}`, name]) {
    // A plain user agent makes Google serve .ttf, which the canvas reads everywhere.
    const response = await fetch(`https://fonts.googleapis.com/css2?family=${query}`, { headers: { 'user-agent': 'pincel' } });
    if (response.ok) return response.text();
  }
  throw new Error(`Google Fonts has no family called "${family}" (check the exact name on fonts.google.com)`);
}

async function download(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not download font: HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length > MAX_BYTES) throw new Error('Font file is larger than 10 MB');
  return bytes;
}
