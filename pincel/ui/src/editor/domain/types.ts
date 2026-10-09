export type Point = [x: number, y: number];

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayerMeta {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
  blendMode: string;
  mask: { enabled: boolean } | null;
}

export interface EditEntry {
  /** Tool name, or the batch label. */
  type: string;
  /** How many commands this undo step holds (more than 1 for a batch). */
  edits: number;
  source: 'mcp' | 'rest' | 'ui';
  at: string;
}

/** Mirrors GET /api/document. */
export interface DocumentSnapshot {
  version: number;
  width: number;
  height: number;
  activeLayerId: string;
  layersBottomToTop: LayerMeta[];
  /** null = no selection. */
  selection: { bounds: Rect | null } | null;
  canUndo: boolean;
  canRedo: boolean;
  recentEdits: EditEntry[];
}

export interface ToolSettings {
  primaryColor: string;
  secondaryColor: string;
  size: number;
  opacity: number;
  fillShapes: boolean;
  strokeShapes: boolean;
  fontSize: number;
  fontFamily: string;
  /** Magic wand and paint bucket: how different a color may be (0..255). */
  tolerance: number;
  contiguous: boolean;
  sampleAllLayers: boolean;
  /** Soft edge for new marquee/lasso selections, in px. */
  feather: number;
  /** Paint on the active layer's pixels or on its mask. */
  target: 'pixels' | 'mask';
}

/** A tool call to send to the API: same names and inputs an AI would use. */
export interface ToolCall {
  name: string;
  input: Record<string, unknown>;
}
