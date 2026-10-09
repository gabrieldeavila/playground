export const BLEND_MODES = [
  'normal',
  'multiply',
  'screen',
  'overlay',
  'darken',
  'lighten',
  'color-dodge',
  'color-burn',
  'hard-light',
  'soft-light',
  'difference',
  'exclusion',
  'hue',
  'saturation',
  'color',
  'luminosity',
] as const;

export type BlendMode = (typeof BLEND_MODES)[number];

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
  /** 0..1 */
  opacity: number;
  blendMode: BlendMode;
  /** Grayscale mask (white shows, black hides); null when the layer has none. */
  mask: { enabled: boolean } | null;
}

export interface DocumentMeta {
  width: number;
  height: number;
  /** Bottom to top, like the Photoshop layers panel read upside down. */
  layers: LayerMeta[];
}

export interface DocumentSetup {
  width: number;
  height: number;
  /** CSS color, or "transparent" for an empty background layer. */
  background: string;
}
