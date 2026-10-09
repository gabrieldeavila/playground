import { surfaceOf, type DocState } from '../commands/doc-state.js';
import { compositeLayer } from './composite.js';
import type { PaintEnv, Surface } from './surface.js';

/** The flattened image: every visible layer, bottom to top. */
export function renderComposite(state: DocState, env: PaintEnv): Surface {
  const out = env.createSurface(state.meta.width, state.meta.height);
  const ctx = out.getContext('2d');
  for (const layer of state.meta.layers) {
    compositeLayer(ctx, layer, surfaceOf(state, layer.id), state.masks.get(layer.id), env);
  }
  return out;
}
