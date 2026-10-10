import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createFontStore } from './font-store.js';

const SYSTEM_FONT = '/System/Library/Fonts/Supplemental/Arial.ttf';

async function fontBytes(): Promise<Buffer | null> {
  return readFile(SYSTEM_FONT).catch(() => null);
}

describe('font store', () => {
  it('rejects bytes that are not a font', async () => {
    const store = createFontStore(await mkdtemp(join(tmpdir(), 'pincel-fonts-')));
    await expect(store.save({ family: 'Junk', weight: '400', style: 'normal' }, Buffer.from('nope'))).rejects.toThrow(/Not a font/);
    expect(await store.list()).toEqual([]);
  });

  it('keeps every face when several are saved at once', async (ctx) => {
    const bytes = await fontBytes();
    if (!bytes) return ctx.skip();
    const store = createFontStore(await mkdtemp(join(tmpdir(), 'pincel-fonts-')));
    await Promise.all(['400', '700', '900'].map((weight) => store.save({ family: 'Test Sans', weight, style: 'normal' }, bytes)));
    expect((await store.list()).map((font) => font.weight).sort()).toEqual(['400', '700', '900']);
  });
});
