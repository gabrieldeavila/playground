import { useCallback } from 'react';
import type { ToolResponse } from '../api/pincel-api';
import type { EditorToolId } from '../domain/editor-tools';
import { clickToToolCall, gestureToToolCall, textToToolCall } from '../domain/gesture-to-tool-call';
import type { SelectionMode } from '../domain/selection-mode';
import type { DocumentSnapshot, Point, ToolCall, ToolSettings } from '../domain/types';

interface Deps {
  doc: DocumentSnapshot;
  tool: EditorToolId;
  settings: ToolSettings;
  run: (call: ToolCall) => Promise<ToolResponse | null>;
  updateSettings: (changes: Partial<ToolSettings>) => void;
  openTextEntry: (point: Point) => void;
}

/** Translates canvas gestures into tool calls on the active layer. */
export function useEditorActions({ doc, tool, settings, run, updateSettings, openTextEntry }: Deps) {
  const layerId = doc.activeLayerId;

  const commitDrag = useCallback(
    async (points: Point[], mode: SelectionMode) => {
      const call = gestureToToolCall(tool, points, settings, layerId, mode);
      return call ? run(call) : null;
    },
    [tool, settings, layerId, run],
  );

  const clickAt = useCallback(
    async (point: Point, mode: SelectionMode) => {
      if (tool === 'text') return openTextEntry(point);
      if (tool === 'eyedropper') {
        const result = await run({ name: 'sample_color', input: { x: point[0], y: point[1] } });
        const color = (result?.data as { color?: string } | undefined)?.color;
        if (color) updateSettings({ primaryColor: color.slice(0, 7) });
        return;
      }
      const call = clickToToolCall(tool, point, settings, layerId, mode);
      if (call) await run(call);
    },
    [tool, settings, layerId, run, updateSettings, openTextEntry],
  );

  const commitText = useCallback(
    (text: string, point: Point) => run(textToToolCall(text, point, settings, layerId)),
    [settings, layerId, run],
  );

  return { commitDrag, clickAt, commitText };
}
