import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { GlobalFonts } from '@napi-rs/canvas';

export interface FontFaceInfo {
  family: string;
  weight: string;
  style: string;
}

export interface SavedFont extends FontFaceInfo {
  file: string;
}

/**
 * Fonts loaded with load_font, kept on disk and registered again on startup so
 * saved documents that use them replay with the same letters.
 */
export function createFontStore(dir: string) {
  const manifestPath = join(dir, 'fonts.json');
  let queue: Promise<unknown> = Promise.resolve();

  async function list(): Promise<SavedFont[]> {
    try {
      return JSON.parse(await readFile(manifestPath, 'utf8')) as SavedFont[];
    } catch {
      return [];
    }
  }

  return {
    list,

    /** Registers every saved font with the canvas. Returns how many were registered. */
    async registerSaved(): Promise<number> {
      const fonts = await list();
      return fonts.filter((font) => GlobalFonts.registerFromPath(join(dir, font.file), font.family)).length;
    },

    /** Registers a font file under its family name and keeps it for next time. */
    save(face: FontFaceInfo, bytes: Buffer): Promise<SavedFont> {
      // One save at a time, so concurrent saves don't overwrite each other's manifest entry.
      const saved = queue.then(() => saveNow(face, bytes));
      queue = saved.catch(() => undefined);
      return saved;
    },
  };

  async function saveNow(face: FontFaceInfo, bytes: Buffer): Promise<SavedFont> {
    if (!GlobalFonts.register(bytes, face.family)) throw new Error(`Not a font file this editor can read (${face.family})`);
    const file = `${slug(face.family)}-${face.weight}-${face.style}.font`;
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, file), bytes);
    const others = (await list()).filter((font) => font.file !== file);
    const saved = { ...face, file };
    await writeFile(manifestPath, JSON.stringify([...others, saved], null, 2));
    return saved;
  }
}

export type FontStore = ReturnType<typeof createFontStore>;

/** True for installed system fonts and fonts loaded with load_font. */
export function isFontInstalled(family: string): boolean {
  return GlobalFonts.has(family);
}

function slug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
