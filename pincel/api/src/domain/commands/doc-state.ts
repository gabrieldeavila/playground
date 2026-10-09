import type { DocumentMeta, DocumentSetup } from '../document/types.js';
import { newLayer } from '../document/layer-stack.js';
import type { PaintEnv, Surface } from '../paint/surface.js';

/**
 * The live document: layer metadata, one pixel surface per layer, the layers'
 * masks, and the current selection. Masks and the selection are opaque
 * grayscale surfaces (white = visible/selected). No selection means everything
 * is editable.
 */
export interface DocState {
  meta: DocumentMeta;
  surfaces: Map<string, Surface>;
  masks: Map<string, Surface>;
  selection: Surface | null;
}

export const BACKGROUND_LAYER_ID = 'layer_1';

export function createDocState(setup: DocumentSetup, env: PaintEnv): DocState {
  const surface = env.createSurface(setup.width, setup.height);
  if (setup.background !== 'transparent') {
    const ctx = surface.getContext('2d');
    ctx.fillStyle = setup.background;
    ctx.fillRect(0, 0, setup.width, setup.height);
  }
  return {
    meta: { width: setup.width, height: setup.height, layers: [newLayer(BACKGROUND_LAYER_ID, 'Background')] },
    surfaces: new Map([[BACKGROUND_LAYER_ID, surface]]),
    masks: new Map(),
    selection: null,
  };
}

export function surfaceOf(state: DocState, layerId: string): Surface {
  const surface = state.surfaces.get(layerId);
  if (!surface) throw new Error(`Layer "${layerId}" does not exist`);
  return surface;
}

export function maskOf(state: DocState, layerId: string): Surface {
  const mask = state.masks.get(layerId);
  if (!mask) throw new Error(`Layer "${layerId}" has no mask. Add one with add_layer_mask.`);
  return mask;
}
