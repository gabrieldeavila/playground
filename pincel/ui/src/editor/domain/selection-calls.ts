import { ellipseFromDrag, rectFromDrag, simplifyPoints } from './drag-geometry';
import type { EditorToolId } from './editor-tools';
import type { SelectionMode } from './selection-mode';
import type { Point, ToolCall, ToolSettings } from './types';

const DESELECT: ToolCall = { name: 'modify_selection', input: { action: 'deselect' } };

/** Marquee and lasso drags become select_* calls; a plain click (no drag) deselects, like Photoshop. */
export function selectionDragToCall(tool: EditorToolId, points: Point[], s: ToolSettings, mode: SelectionMode): ToolCall | null {
  const first = points[0];
  const last = points[points.length - 1];
  const moved = first && Math.hypot(last[0] - first[0], last[1] - first[1]) >= 2;
  if (!moved) return mode === 'replace' ? DESELECT : null;
  const common = { mode, feather: s.feather };
  if (tool === 'select-rect') return { name: 'select_rect', input: { rect: rectFromDrag(first, last), ...common } };
  if (tool === 'select-ellipse') return { name: 'select_ellipse', input: { ...ellipseFromDrag(first, last), ...common } };
  if (tool === 'lasso') {
    const outline = simplifyPoints(points, 3);
    return outline.length >= 3 ? { name: 'select_lasso', input: { points: outline, ...common } } : null;
  }
  return null;
}

export function magicWandCall(point: Point, s: ToolSettings, layerId: string, mode: SelectionMode): ToolCall {
  return {
    name: 'select_color',
    input: {
      point,
      tolerance: s.tolerance,
      contiguous: s.contiguous,
      mode,
      ...(s.sampleAllLayers ? {} : { layerId }),
    },
  };
}
