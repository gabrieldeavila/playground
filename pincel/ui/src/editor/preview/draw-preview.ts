import { ellipseFromDrag, rectFromDrag } from '../domain/drag-geometry';
import type { EditorToolId } from '../domain/editor-tools';
import { gradientStops, shapeStyle } from '../domain/gesture-to-tool-call';
import type { Point, ToolSettings } from '../domain/types';

/** Draws an in-progress gesture on the overlay so the user sees it before the server renders it. */
export function drawPreview(ctx: CanvasRenderingContext2D, tool: EditorToolId, points: Point[], s: ToolSettings): void {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  const first = points[0];
  const last = points[points.length - 1];
  if (!first) return;
  ctx.save();
  if (tool === 'brush' || tool === 'eraser') strokePreview(ctx, points, tool === 'eraser' ? 'rgba(255,255,255,0.8)' : s.primaryColor, s);
  if (tool === 'line') linePreview(ctx, first, last, s);
  if (tool === 'rect' || tool === 'ellipse') shapePreview(ctx, tool, first, last, s);
  if (tool === 'gradient') gradientPreview(ctx, first, last, s);
  if (tool === 'move') movePreview(ctx, first, last);
  if (tool === 'select-rect' || tool === 'select-ellipse' || tool === 'lasso') selectionPreview(ctx, tool, points);
  ctx.restore();
}

function strokePreview(ctx: CanvasRenderingContext2D, points: Point[], color: string, s: ToolSettings) {
  ctx.globalAlpha = s.opacity;
  ctx.strokeStyle = color;
  ctx.lineWidth = s.size;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  points.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  if (points.length === 1) ctx.lineTo(points[0][0] + 0.01, points[0][1]);
  ctx.stroke();
}

function linePreview(ctx: CanvasRenderingContext2D, a: Point, b: Point, s: ToolSettings) {
  strokePreview(ctx, [a, b], s.primaryColor, { ...s, opacity: 1 });
}

function shapePreview(ctx: CanvasRenderingContext2D, tool: 'rect' | 'ellipse', a: Point, b: Point, s: ToolSettings) {
  const style = shapeStyle(s);
  ctx.beginPath();
  if (tool === 'rect') {
    const r = rectFromDrag(a, b);
    ctx.rect(r.x, r.y, r.width, r.height);
  } else {
    const { center, radiusX, radiusY } = ellipseFromDrag(a, b);
    ctx.ellipse(center[0], center[1], radiusX, radiusY, 0, 0, Math.PI * 2);
  }
  if (style.fill) {
    ctx.fillStyle = style.fill;
    ctx.fill();
  }
  if (style.stroke) {
    ctx.strokeStyle = style.stroke;
    ctx.lineWidth = style.strokeWidth;
    ctx.stroke();
  }
}

function gradientPreview(ctx: CanvasRenderingContext2D, a: Point, b: Point, s: ToolSettings) {
  const gradient = ctx.createLinearGradient(a[0], a[1], b[0], b[1]);
  for (const stop of gradientStops(s)) gradient.addColorStop(stop.offset, stop.color);
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  guideLine(ctx, a, b);
}

function movePreview(ctx: CanvasRenderingContext2D, a: Point, b: Point) {
  guideLine(ctx, a, b);
}

/** Dashed black/white outline, readable on any image. */
function selectionPreview(ctx: CanvasRenderingContext2D, tool: 'select-rect' | 'select-ellipse' | 'lasso', points: Point[]) {
  const first = points[0];
  const last = points[points.length - 1];
  ctx.beginPath();
  if (tool === 'select-rect') {
    const r = rectFromDrag(first, last);
    ctx.rect(r.x, r.y, r.width, r.height);
  } else if (tool === 'select-ellipse') {
    const { center, radiusX, radiusY } = ellipseFromDrag(first, last);
    ctx.ellipse(center[0], center[1], radiusX, radiusY, 0, 0, Math.PI * 2);
  } else {
    points.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
    ctx.closePath();
  }
  const width = Math.max(1, ctx.canvas.width / 600);
  ctx.lineWidth = width;
  ctx.setLineDash([]);
  ctx.strokeStyle = '#000';
  ctx.stroke();
  ctx.setLineDash([width * 4, width * 4]);
  ctx.strokeStyle = '#fff';
  ctx.stroke();
}

function guideLine(ctx: CanvasRenderingContext2D, [x0, y0]: Point, [x1, y1]: Point) {
  ctx.globalAlpha = 1;
  ctx.setLineDash([6, 4]);
  ctx.strokeStyle = '#4f8cff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
}
