import type { Point, Rect } from './types';

/** Normalized rectangle between two drag corners (works in any drag direction). */
export function rectFromDrag([x0, y0]: Point, [x1, y1]: Point): Rect {
  return { x: Math.min(x0, x1), y: Math.min(y0, y1), width: Math.abs(x1 - x0), height: Math.abs(y1 - y0) };
}

export function ellipseFromDrag(a: Point, b: Point): { center: Point; radiusX: number; radiusY: number } {
  const r = rectFromDrag(a, b);
  return { center: [r.x + r.width / 2, r.y + r.height / 2], radiusX: r.width / 2, radiusY: r.height / 2 };
}

/** Drops points closer than `minDistance` to the previously kept one; always keeps the last point. */
export function simplifyPoints(points: Point[], minDistance = 1.5): Point[] {
  if (points.length <= 2) return points;
  const kept: Point[] = [points[0]];
  for (const point of points.slice(1, -1)) {
    const [px, py] = kept[kept.length - 1];
    if (Math.hypot(point[0] - px, point[1] - py) >= minDistance) kept.push(point);
  }
  kept.push(points[points.length - 1]);
  return kept;
}
