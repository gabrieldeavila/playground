import { blur } from './blur.js';
import { brightness } from './brightness.js';
import { contrast } from './contrast.js';
import { grayscale } from './grayscale.js';
import { hueRotate } from './hue-rotate.js';
import { invert } from './invert.js';
import type { PixelBuffer } from './pixel-buffer.js';
import { pixelate } from './pixelate.js';
import { posterize } from './posterize.js';
import { saturation } from './saturation.js';
import { sepia } from './sepia.js';
import { sharpen } from './sharpen.js';
import { threshold } from './threshold.js';

export interface FilterSpec {
  apply: (buffer: PixelBuffer, amount: number) => PixelBuffer;
  defaultAmount: number;
  /** Explains what `amount` means, shown to the AI and in the UI. */
  amountHint: string;
}

export const FILTERS = {
  grayscale: { apply: grayscale, defaultAmount: 1, amountHint: '0..1 strength' },
  sepia: { apply: sepia, defaultAmount: 1, amountHint: '0..1 strength' },
  invert: { apply: invert, defaultAmount: 1, amountHint: '0..1 strength' },
  brightness: { apply: brightness, defaultAmount: 0.2, amountHint: '-1..1, 0 = unchanged' },
  contrast: { apply: contrast, defaultAmount: 0.3, amountHint: '-1..1, 0 = unchanged' },
  saturation: { apply: saturation, defaultAmount: 0.5, amountHint: '-1..1, -1 = gray' },
  hue_rotate: { apply: hueRotate, defaultAmount: 90, amountHint: 'degrees' },
  blur: { apply: blur, defaultAmount: 4, amountHint: 'radius in px' },
  sharpen: { apply: sharpen, defaultAmount: 0.6, amountHint: '0..2 strength' },
  threshold: { apply: threshold, defaultAmount: 0.5, amountHint: '0..1 cut-off' },
  posterize: { apply: posterize, defaultAmount: 4, amountHint: 'tone levels per channel' },
  pixelate: { apply: pixelate, defaultAmount: 8, amountHint: 'block size in px' },
} satisfies Record<string, FilterSpec>;

export type FilterName = keyof typeof FILTERS;

export const FILTER_NAMES = Object.keys(FILTERS) as [FilterName, ...FilterName[]];
