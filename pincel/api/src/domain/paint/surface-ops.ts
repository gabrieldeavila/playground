import { luminanceToAlpha } from '../selection/mask-alpha.js';
import type { PaintEnv, Surface } from './surface.js';

export function copySurface(source: Surface, env: PaintEnv): Surface {
  const copy = env.createSurface(source.width, source.height);
  copy.getContext('2d').drawImage(source, 0, 0);
  return copy;
}

/** Opaque grayscale surface filled with one gray (white = everything selected/visible). */
export function solidGray(width: number, height: number, white: boolean, env: PaintEnv): Surface {
  const surface = env.createSurface(width, height);
  const ctx = surface.getContext('2d');
  ctx.fillStyle = white ? '#ffffff' : '#000000';
  ctx.fillRect(0, 0, width, height);
  return surface;
}

/** Grayscale mask/selection → white surface whose alpha is the gray level, ready for destination-in/out. */
export function grayToAlpha(gray: Surface, env: PaintEnv): Surface {
  const ctx = gray.getContext('2d');
  const image = ctx.getImageData(0, 0, gray.width, gray.height);
  luminanceToAlpha(image);
  const out = env.createSurface(gray.width, gray.height);
  out.getContext('2d').putImageData(image, 0, 0);
  return out;
}

/** Keeps (`destination-in`) or removes (`destination-out`) the parts of `target` covered by an alpha mask. */
export function clipToAlpha(target: Surface, alpha: Surface, op: 'destination-in' | 'destination-out'): void {
  const ctx = target.getContext('2d');
  ctx.save();
  ctx.globalCompositeOperation = op;
  ctx.drawImage(alpha, 0, 0);
  ctx.restore();
}

/** Makes transparent areas black so a moved/resized mask stays opaque grayscale. */
export function flattenOnBlack(gray: Surface): void {
  const ctx = gray.getContext('2d');
  ctx.save();
  ctx.globalCompositeOperation = 'destination-over';
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, gray.width, gray.height);
  ctx.restore();
}
