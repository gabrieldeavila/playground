import type { PixelBuffer } from '../filters/pixel-buffer.js';
import { selectionEdges } from './selection-edges.js';

const DASH = 4;

/**
 * Image to lay over the canvas: unselected areas dimmed, the border drawn as
 * black/white "marching ants".
 */
export function selectionOverlayPixels(selection: PixelBuffer): PixelBuffer {
  const { width, height, data } = selection;
  const edges = selectionEdges(selection);
  const out = new Uint8ClampedArray(width * height * 4);
  for (let p = 0; p < edges.length; p++) {
    const i = p * 4;
    if (edges[p]) {
      const light = (Math.floor((p % width) / DASH) + Math.floor(p / width / DASH)) % 2 === 0;
      out[i] = out[i + 1] = out[i + 2] = light ? 255 : 0;
      out[i + 3] = 255;
    } else {
      const unselected = 255 - (data[i] * data[i + 3]) / 255;
      out[i] = 10;
      out[i + 1] = 20;
      out[i + 2] = 60;
      out[i + 3] = unselected * 0.45;
    }
  }
  return { width, height, data: out };
}
