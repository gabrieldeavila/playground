import type { Rect } from '../domain/document/types.js';
import type { Ctx } from '../domain/paint/surface.js';

/** Numbered circles over a render, in document coordinates mapped through region/scale. */
export function drawMarkers(ctx: Ctx, markers: { center: [number, number]; radius: number }[], region: Rect, scale: number): void {
  ctx.save();
  ctx.font = `${Math.max(10, Math.round(11 * Math.min(scale, 2)))}px sans-serif`;
  markers.forEach(({ center, radius }, i) => {
    const x = (center[0] - region.x) * scale;
    const y = (center[1] - region.y) * scale;
    ctx.beginPath();
    ctx.arc(x, y, Math.max(3, radius * scale), 0, Math.PI * 2);
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(0, 255, 200, 0.95)';
    ctx.stroke();
    ctx.fillStyle = 'rgba(0, 255, 200, 0.95)';
    ctx.fillText(String(i + 1), x + radius * scale + 2, y - radius * scale - 2);
  });
  ctx.restore();
}
