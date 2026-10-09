import type { EditorToolId } from './editor-tools';

const SELECTION_KEYS = 'Shift adds, Alt subtracts, both intersect';

export const TOOL_HINTS: Record<EditorToolId, string> = {
  move: 'Drag to move the active layer (only the selection, if there is one)',
  'select-rect': `Drag to select. Click to deselect. ${SELECTION_KEYS}`,
  'select-ellipse': `Drag to select. Click to deselect. ${SELECTION_KEYS}`,
  lasso: `Draw around an area to select it. ${SELECTION_KEYS}`,
  'magic-wand': `Click to select similar color. ${SELECTION_KEYS}`,
  brush: 'Drag to paint',
  eraser: 'Drag to erase',
  rect: 'Drag to draw a rectangle',
  ellipse: 'Drag to draw an ellipse',
  line: 'Drag to draw a line',
  gradient: 'Drag for a primary → secondary gradient',
  text: 'Click where the text should start',
  fill: 'Click to fill the area of similar color',
  eyedropper: 'Click to pick a color',
};
