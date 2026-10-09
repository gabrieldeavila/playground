import type { SelectionMode, SelectionShape } from '../commands/command-types.js';
import { blur } from '../filters/blur.js';
import { copySurface, solidGray } from '../paint/surface-ops.js';
import type { PaintEnv, Surface } from '../paint/surface.js';
import { coverageToGray } from './mask-alpha.js';

/** White shape on black: an antialiased selection of just that shape. */
export function shapeSelection(shape: SelectionShape, width: number, height: number, env: PaintEnv): Surface {
  const surface = solidGray(width, height, false, env);
  const ctx = surface.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  if (shape.kind === 'rect') ctx.rect(shape.rect.x, shape.rect.y, shape.rect.width, shape.rect.height);
  if (shape.kind === 'ellipse') {
    ctx.ellipse(shape.center[0], shape.center[1], Math.abs(shape.radiusX), Math.abs(shape.radiusY), 0, 0, Math.PI * 2);
  }
  if (shape.kind === 'polygon') shape.points.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  ctx.closePath();
  ctx.fill();
  return surface;
}

export function coverageSelection(coverage: ArrayLike<number>, width: number, height: number, env: PaintEnv): Surface {
  const surface = env.createSurface(width, height);
  const gray = coverageToGray(coverage, width, height);
  const image = surface.getContext('2d').createImageData(width, height);
  image.data.set(gray.data);
  surface.getContext('2d').putImageData(image, 0, 0);
  return surface;
}

/**
 * Combines a new selection with the current one, like holding Shift (add),
 * Alt (subtract) or both (intersect) in Photoshop. Selections are opaque
 * grayscale, so lighten/darken are per-pixel max/min.
 */
export function combineSelection(current: Surface | null, next: Surface, mode: SelectionMode, env: PaintEnv): Surface | null {
  if (mode === 'replace' || (mode === 'add' && !current)) return next;
  if (!current) return null;
  const result = copySurface(current, env);
  const ctx = result.getContext('2d');
  ctx.globalCompositeOperation = mode === 'add' ? 'lighten' : 'darken';
  ctx.drawImage(mode === 'subtract' ? invertedGray(next, env) : next, 0, 0);
  return result;
}

export function invertedGray(gray: Surface, env: PaintEnv): Surface {
  const result = solidGray(gray.width, gray.height, true, env);
  const ctx = result.getContext('2d');
  ctx.globalCompositeOperation = 'difference';
  ctx.drawImage(gray, 0, 0);
  return result;
}

/** Softens the selection edge by `radius` pixels. */
export function featherGray(gray: Surface, radius: number, env: PaintEnv): Surface {
  if (radius <= 0) return gray;
  const result = copySurface(gray, env);
  const ctx = result.getContext('2d');
  const image = ctx.getImageData(0, 0, result.width, result.height);
  blur(image, radius);
  ctx.putImageData(image, 0, 0);
  return result;
}
