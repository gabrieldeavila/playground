import { createCanvas } from '@napi-rs/canvas';
import { maskOf, surfaceOf, type DocState } from '../domain/commands/doc-state.js';
import { rgbaToHex } from '../domain/color/rgba-to-hex.js';
import { niceGridSpacing } from '../domain/document/grid-lines.js';
import type { Rect } from '../domain/document/types.js';
import { renderComposite } from '../domain/paint/render-composite.js';
import type { Surface } from '../domain/paint/surface.js';
import { drawGrid } from './draw-grid.js';
import { napiPaintEnv } from './napi-paint-env.js';

export interface RenderOptions {
  /** Render only this layer instead of the composite. */
  layerId?: string;
  /** With layerId: render the layer's mask (grayscale) instead of its pixels. */
  mask?: boolean;
  /** Longest side of the output; the image is only ever scaled down. */
  maxSize?: number;
  /** Only this part of the document (zoom in on a detail). */
  region?: Rect;
  /** Overlay labelled grid lines; a number sets the spacing in document pixels. */
  grid?: boolean | number;
}

export function compositeOf(state: DocState): Surface {
  return renderComposite(state, napiPaintEnv);
}

/** PNG of the image (or one layer/mask), optionally cropped, scaled down and gridded so it's cheap and easy for an AI to read. */
export function renderPng(state: DocState, options: RenderOptions = {}): Buffer {
  const source = sourceOf(state, options);
  const region = options.region ?? { x: 0, y: 0, width: source.width, height: source.height };
  const scale = Math.min(1, (options.maxSize ?? Infinity) / Math.max(region.width, region.height));
  const out = createCanvas(Math.max(1, Math.round(region.width * scale)), Math.max(1, Math.round(region.height * scale)));
  const ctx = out.getContext('2d');
  ctx.drawImage(source, region.x, region.y, region.width, region.height, 0, 0, out.width, out.height);
  if (options.grid) {
    const spacing = typeof options.grid === 'number' ? options.grid : niceGridSpacing(region.width, region.height);
    drawGrid(ctx, region, scale, spacing);
  }
  return out.toBuffer('image/png');
}

function sourceOf(state: DocState, { layerId, mask }: RenderOptions): Surface {
  if (!layerId) return compositeOf(state);
  return mask ? maskOf(state, layerId) : surfaceOf(state, layerId);
}

export function sampleColor(state: DocState, x: number, y: number, layerId?: string): string {
  const source = layerId ? surfaceOf(state, layerId) : compositeOf(state);
  const [r, g, b, a] = source.getContext('2d').getImageData(Math.floor(x), Math.floor(y), 1, 1).data;
  return rgbaToHex(r, g, b, a);
}
