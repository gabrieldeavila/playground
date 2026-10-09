import { surfaceOf, type DocState } from '../domain/commands/doc-state.js';
import { contentBounds } from '../domain/document/content-bounds.js';
import type { Rect } from '../domain/document/types.js';

export function layerBounds(state: DocState, layerId: string): Rect | null {
  const surface = surfaceOf(state, layerId);
  return contentBounds(surface.getContext('2d').getImageData(0, 0, surface.width, surface.height));
}
