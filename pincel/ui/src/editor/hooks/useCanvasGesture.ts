import { useCallback, useRef, type PointerEvent } from 'react';
import { toCanvasPoint } from '../domain/canvas-coords';
import { CLICK_TOOLS, FREEHAND_TOOLS, type EditorToolId } from '../domain/editor-tools';
import { selectionModeFromKeys, type SelectionMode } from '../domain/selection-mode';
import type { Point, ToolSettings } from '../domain/types';
import { drawPreview } from '../preview/draw-preview';

interface Options {
  doc: { width: number; height: number };
  tool: EditorToolId;
  settings: ToolSettings;
  onDrag: (points: Point[], mode: SelectionMode) => void;
  onClick: (point: Point, mode: SelectionMode) => void;
}

/** Pointer handling on the overlay canvas: collects drag points and draws a live preview. */
export function useCanvasGesture({ doc, tool, settings, onDrag, onClick }: Options) {
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const points = useRef<Point[]>([]);
  const mode = useRef<SelectionMode>('replace');
  const dragging = useRef(false);

  const pointOf = (event: PointerEvent) =>
    toCanvasPoint(event.clientX, event.clientY, event.currentTarget.getBoundingClientRect(), doc);

  const redraw = () => {
    const ctx = overlayRef.current?.getContext('2d');
    if (ctx) drawPreview(ctx, tool, points.current, settings);
  };

  const onPointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    if (event.button !== 0) return;
    // Keeps focus where it is; otherwise the click steals focus from the text tool's input.
    event.preventDefault();
    const point = pointOf(event);
    mode.current = selectionModeFromKeys({ shift: event.shiftKey, alt: event.altKey });
    if (CLICK_TOOLS.has(tool)) return onClick(point, mode.current);
    event.currentTarget.setPointerCapture(event.pointerId);
    dragging.current = true;
    points.current = [point];
    redraw();
  };

  const onPointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!dragging.current) return;
    const point = pointOf(event);
    points.current = FREEHAND_TOOLS.has(tool) ? [...points.current, point] : [points.current[0], point];
    redraw();
  };

  const onPointerUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    onDrag(points.current, mode.current);
  };

  const clearPreview = useCallback(() => {
    const canvas = overlayRef.current;
    canvas?.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  return { overlayRef, handlers: { onPointerDown, onPointerMove, onPointerUp }, clearPreview };
}
