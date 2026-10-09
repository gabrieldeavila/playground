import type { Rect } from './types.js';

export interface FitRequest {
  natural: { width: number; height: number };
  canvas: { width: number; height: number };
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  /** "contain"/"cover" fit the image to the whole canvas, centered. */
  fit?: 'none' | 'contain' | 'cover';
}

/** Works out where an image lands; a single missing side keeps the aspect ratio. */
export function fitImage(req: FitRequest): Rect {
  if (req.fit === 'contain' || req.fit === 'cover') return fitToCanvas(req);
  const ratio = req.natural.width / req.natural.height;
  const width = req.width ?? (req.height !== undefined ? req.height * ratio : req.natural.width);
  const height = req.height ?? (req.width !== undefined ? req.width / ratio : req.natural.height);
  return { x: req.x ?? 0, y: req.y ?? 0, width, height };
}

function fitToCanvas({ natural, canvas, fit }: FitRequest): Rect {
  const scales = [canvas.width / natural.width, canvas.height / natural.height];
  const scale = fit === 'contain' ? Math.min(...scales) : Math.max(...scales);
  const width = natural.width * scale;
  const height = natural.height * scale;
  return { x: (canvas.width - width) / 2, y: (canvas.height - height) / 2, width, height };
}
