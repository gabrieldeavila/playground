export const EDITOR_TOOLS = [
  { id: 'move', label: 'Move', shortcut: 'v' },
  { id: 'select-rect', label: 'Rectangular marquee', shortcut: 'm' },
  { id: 'select-ellipse', label: 'Elliptical marquee', shortcut: 'k' },
  { id: 'lasso', label: 'Lasso', shortcut: 'l' },
  { id: 'magic-wand', label: 'Magic wand', shortcut: 'w' },
  { id: 'brush', label: 'Brush', shortcut: 'b' },
  { id: 'eraser', label: 'Eraser', shortcut: 'e' },
  { id: 'rect', label: 'Rectangle', shortcut: 'u' },
  { id: 'ellipse', label: 'Ellipse', shortcut: 'o' },
  { id: 'line', label: 'Line', shortcut: 'n' },
  { id: 'gradient', label: 'Gradient', shortcut: 'g' },
  { id: 'text', label: 'Text', shortcut: 't' },
  { id: 'fill', label: 'Paint bucket', shortcut: 'f' },
  { id: 'eyedropper', label: 'Eyedropper', shortcut: 'i' },
] as const;

export type EditorToolId = (typeof EDITOR_TOOLS)[number]['id'];

/** Tools that are a click, not a drag. */
export const CLICK_TOOLS: ReadonlySet<EditorToolId> = new Set(['text', 'fill', 'eyedropper', 'magic-wand']);

/** Tools whose drag keeps every point (not just start and end). */
export const FREEHAND_TOOLS: ReadonlySet<EditorToolId> = new Set(['brush', 'eraser', 'lasso']);

export const SELECTION_TOOLS: ReadonlySet<EditorToolId> = new Set(['select-rect', 'select-ellipse', 'lasso', 'magic-wand']);

/** Tools that paint and so can target the layer mask. */
export const MASKABLE_TOOLS: ReadonlySet<EditorToolId> = new Set([
  'move',
  'brush',
  'eraser',
  'rect',
  'ellipse',
  'line',
  'gradient',
  'text',
  'fill',
]);

export function toolForShortcut(key: string): EditorToolId | undefined {
  return EDITOR_TOOLS.find((tool) => tool.shortcut === key.toLowerCase())?.id;
}
