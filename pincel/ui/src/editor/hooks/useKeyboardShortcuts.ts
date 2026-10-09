import { useEffect, useRef } from 'react';
import { toolForShortcut, type EditorToolId } from '../domain/editor-tools';

export interface ShortcutActions {
  selectTool: (tool: EditorToolId) => void;
  undo: () => void;
  redo: () => void;
  swapColors: () => void;
  selectAll: () => void;
  deselect: () => void;
  invertSelection: () => void;
  layerViaCopy: () => void;
  layerViaCut: () => void;
  deletePixels: () => void;
}

/** Photoshop-like shortcuts (⌘ on macOS, Ctrl elsewhere). */
export function useKeyboardShortcuts(actions: ShortcutActions) {
  const latest = useRef(actions);
  latest.current = actions;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (isTyping(event.target)) return;
      const action = actionFor(event, latest.current);
      if (!action) return;
      event.preventDefault();
      action();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}

function actionFor(event: KeyboardEvent, a: ShortcutActions): (() => void) | undefined {
  const key = event.key.toLowerCase();
  if (event.metaKey || event.ctrlKey) {
    if (key === 'z') return event.shiftKey ? a.redo : a.undo;
    if (key === 'a') return a.selectAll;
    if (key === 'd') return a.deselect;
    if (key === 'i' && event.shiftKey) return a.invertSelection;
    if (key === 'j') return event.shiftKey ? a.layerViaCut : a.layerViaCopy;
    return undefined;
  }
  if (key === 'backspace' || key === 'delete') return a.deletePixels;
  if (key === 'escape') return a.deselect;
  if (key === 'x') return a.swapColors;
  const tool = toolForShortcut(key);
  return tool ? () => a.selectTool(tool) : undefined;
}

function isTyping(target: EventTarget | null): boolean {
  return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement;
}
