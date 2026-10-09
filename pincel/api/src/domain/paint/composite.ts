import type { BlendMode, LayerMeta } from '../document/types.js';
import { clipToAlpha, copySurface, grayToAlpha } from './surface-ops.js';
import type { Ctx, PaintEnv, Surface } from './surface.js';

/** Draws `layer` onto `target` honoring visibility, opacity, blend mode and its mask. */
export function compositeLayer(target: Ctx, layer: LayerMeta, pixels: Surface, mask: Surface | undefined, env: PaintEnv): void {
  if (!layer.visible || layer.opacity <= 0) return;
  target.save();
  target.globalAlpha = layer.opacity;
  target.globalCompositeOperation = toCompositeOperation(layer.blendMode);
  target.drawImage(visiblePixels(layer, pixels, mask, env), 0, 0);
  target.restore();
}

/** The layer's pixels as they show through its mask (the pixels themselves when there's no enabled mask). */
export function visiblePixels(layer: LayerMeta, pixels: Surface, mask: Surface | undefined, env: PaintEnv): Surface {
  if (!layer.mask?.enabled || !mask) return pixels;
  const visible = copySurface(pixels, env);
  clipToAlpha(visible, grayToAlpha(mask, env), 'destination-in');
  return visible;
}

function toCompositeOperation(mode: BlendMode): Ctx['globalCompositeOperation'] {
  return mode === 'normal' ? 'source-over' : mode;
}
