import { createCanvas } from '@napi-rs/canvas';
import type { DocState } from '../domain/commands/doc-state.js';
import { contentBounds } from '../domain/document/content-bounds.js';
import type { Rect } from '../domain/document/types.js';
import { luminanceToAlpha } from '../domain/selection/mask-alpha.js';
import { selectionOverlayPixels } from '../domain/selection/selection-overlay.js';

/** Where the selection is (null when nothing is selected). */
export function selectionBounds(state: DocState): Rect | null {
  if (!state.selection) return null;
  const image = state.selection.getContext('2d').getImageData(0, 0, state.selection.width, state.selection.height);
  return contentBounds(luminanceToAlpha(image));
}

/**
 * Transparent PNG with the dimmed outside and marching-ants border, for the
 * editor to lay over the canvas. `maxSize` renders it at the on-screen size so
 * the 1px border stays crisp when the canvas is zoomed out.
 */
export function renderSelectionOverlay(state: DocState, maxSize?: number): Buffer | null {
  if (!state.selection) return null;
  const scale = Math.min(1, (maxSize ?? Infinity) / Math.max(state.selection.width, state.selection.height));
  const width = Math.max(1, Math.round(state.selection.width * scale));
  const height = Math.max(1, Math.round(state.selection.height * scale));
  const scaled = createCanvas(width, height);
  scaled.getContext('2d').drawImage(state.selection, 0, 0, width, height);
  const pixels = selectionOverlayPixels(scaled.getContext('2d').getImageData(0, 0, width, height));
  const out = createCanvas(width, height);
  const ctx = out.getContext('2d');
  const image = ctx.createImageData(width, height);
  image.data.set(pixels.data);
  ctx.putImageData(image, 0, 0);
  return out.toBuffer('image/png');
}
