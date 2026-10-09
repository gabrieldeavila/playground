import { surfaceOf, type DocState } from '../domain/commands/doc-state.js';
import type { Rect } from '../domain/document/types.js';
import { findSpots, type FoundSpot } from '../domain/retouch/find-spots.js';

/** Runs the blemish detector on a layer, keeping only spots inside the selection (if any). */
export function findSpotsOnLayer(
  state: DocState,
  layerId: string,
  options: { threshold: number; maxRadius: number; minRadius: number; region?: Rect },
): FoundSpot[] {
  const surface = surfaceOf(state, layerId);
  const image = surface.getContext('2d').getImageData(0, 0, surface.width, surface.height);
  const selection = state.selection?.getContext('2d').getImageData(0, 0, surface.width, surface.height).data;
  const allowed = selection ? (x: number, y: number) => selection[(y * surface.width + x) * 4] >= 128 : undefined;
  return findSpots(image, { ...options, allowed });
}
