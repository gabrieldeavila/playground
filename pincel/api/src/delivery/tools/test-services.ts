import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createFontStore } from '../../data/font-store.js';
import { createPresetStore } from '../../data/preset-store.js';

const dir = join(tmpdir(), `pincel-test-${process.pid}`);

/** Font and preset stores for specs, kept out of the real .data folder. */
export const testServices = {
  fonts: createFontStore(join(dir, 'fonts')),
  presets: createPresetStore(join(dir, 'presets')),
};
