import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createFontStore } from '../../data/font-store.js';

/** Font store for specs, kept out of the real .data folder. */
export const testFontStore = createFontStore(join(tmpdir(), `pincel-fonts-${process.pid}`));
