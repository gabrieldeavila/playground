import { ellipseFromDrag, rectFromDrag, simplifyPoints } from './drag-geometry';
import { SELECTION_TOOLS, type EditorToolId } from './editor-tools';
import { magicWandCall, selectionDragToCall } from './selection-calls';
import type { SelectionMode } from './selection-mode';
import type { Point, ToolCall, ToolSettings } from './types';

/**
 * Turns a finished drag into the same API tool call an AI would make.
 * Returns null when the gesture is too small to mean anything.
 */
export function gestureToToolCall(
  tool: EditorToolId,
  points: Point[],
  s: ToolSettings,
  layerId: string,
  mode: SelectionMode = 'replace',
): ToolCall | null {
  if (SELECTION_TOOLS.has(tool)) return selectionDragToCall(tool, points, s, mode);
  const call = paintDragToCall(tool, points, s, layerId);
  return call && withTarget(call, s);
}

function paintDragToCall(tool: EditorToolId, points: Point[], s: ToolSettings, layerId: string): ToolCall | null {
  const first = points[0];
  const last = points[points.length - 1];
  if (!first) return null;
  const moved = Math.hypot(last[0] - first[0], last[1] - first[1]) >= 2;

  switch (tool) {
    case 'brush':
    case 'eraser':
      return {
        name: 'brush_stroke',
        input: {
          layerId,
          points: simplifyPoints(points),
          color: s.primaryColor,
          size: s.size,
          opacity: s.opacity,
          erase: tool === 'eraser',
        },
      };
    case 'move':
      return moved ? { name: 'transform_layer', input: { layerId, dx: last[0] - first[0], dy: last[1] - first[1] } } : null;
    case 'rect':
      return moved ? { name: 'draw_rect', input: { layerId, rect: rectFromDrag(first, last), ...shapeStyle(s) } } : null;
    case 'ellipse':
      return moved ? { name: 'draw_ellipse', input: { layerId, ...ellipseFromDrag(first, last), ...shapeStyle(s) } } : null;
    case 'line':
      return moved
        ? { name: 'draw_path', input: { layerId, points: [first, last], stroke: s.primaryColor, strokeWidth: s.size } }
        : null;
    case 'gradient':
      return moved ? { name: 'draw_gradient', input: { layerId, kind: 'linear', from: first, to: last, stops: gradientStops(s) } } : null;
    default:
      return null;
  }
}

/** Click tools that don't need extra input. Text and eyedropper are handled by their own flows. */
export function clickToToolCall(
  tool: EditorToolId,
  point: Point,
  s: ToolSettings,
  layerId: string,
  mode: SelectionMode = 'replace',
): ToolCall | null {
  if (tool === 'magic-wand') return magicWandCall(point, s, layerId, mode);
  if (tool !== 'fill') return null;
  return withTarget(
    {
      name: 'flood_fill',
      input: {
        layerId,
        point,
        color: s.primaryColor,
        tolerance: s.tolerance,
        contiguous: s.contiguous,
        sampleAllLayers: s.sampleAllLayers,
      },
    },
    s,
  );
}

export function textToToolCall(text: string, position: Point, s: ToolSettings, layerId: string): ToolCall {
  return withTarget(
    { name: 'draw_text', input: { layerId, text, position, size: s.fontSize, font: s.fontFamily, color: s.primaryColor } },
    s,
  );
}

/** Paint calls go to the layer mask while the mask is being edited. */
function withTarget(call: ToolCall, s: ToolSettings): ToolCall {
  return s.target === 'mask' ? { ...call, input: { ...call.input, target: 'mask' } } : call;
}

/** Shapes fill with the primary color and outline with the secondary one, like Photoshop's swatches. */
export function shapeStyle(s: ToolSettings): { fill?: string; stroke?: string; strokeWidth: number } {
  return {
    fill: s.fillShapes ? s.primaryColor : undefined,
    stroke: s.strokeShapes ? s.secondaryColor : undefined,
    strokeWidth: s.strokeShapes ? Math.max(1, Math.round(s.size / 4)) : 0,
  };
}

export function gradientStops(s: ToolSettings) {
  return [
    { offset: 0, color: s.primaryColor },
    { offset: 1, color: s.secondaryColor },
  ];
}
