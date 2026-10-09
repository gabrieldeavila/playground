import { createCanvas, loadImage } from '@napi-rs/canvas';
import type { PaintEnv } from '../domain/paint/surface.js';

export const napiPaintEnv: PaintEnv = {
  createSurface: (width, height) => createCanvas(width, height),
  loadImage: (src) => loadImage(src),
};
