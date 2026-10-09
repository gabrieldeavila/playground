import type { FilterName } from '../filters/filter-catalog.js';
import type { BlendMode, Point, Rect } from '../document/types.js';

export interface ShapeStyle {
  fill?: string;
  stroke?: string;
  strokeWidth: number;
}

export interface GradientStop {
  offset: number;
  color: string;
}

/** Paint on the layer's pixels (default) or on its mask (white shows, black hides). */
export type PaintTarget = 'pixels' | 'mask';

/** How a new selection combines with the current one. */
export type SelectionMode = 'replace' | 'add' | 'subtract' | 'intersect';

export type SelectionShape =
  | { kind: 'rect'; rect: Rect }
  | { kind: 'ellipse'; center: Point; radiusX: number; radiusY: number }
  | { kind: 'polygon'; points: Point[] };

interface Targeted {
  target?: PaintTarget;
}

/**
 * Every edit to the document is one of these. The document is rebuilt by
 * replaying them in order, which is what makes undo/redo work.
 * Anything non-deterministic (new ids, fetched images) is resolved before a
 * command is created, so replaying always gives the same pixels.
 */
export type Command =
  | { type: 'add_layer'; layerId: string; name: string; index: number }
  | { type: 'delete_layer'; layerId: string }
  | { type: 'duplicate_layer'; layerId: string; newLayerId: string }
  | {
      type: 'update_layer';
      layerId: string;
      changes: { name?: string; visible?: boolean; opacity?: number; blendMode?: BlendMode; maskEnabled?: boolean };
    }
  | { type: 'reorder_layer'; layerId: string; index: number }
  | { type: 'merge_down'; layerId: string }
  | { type: 'resize_canvas'; width: number; height: number; offsetX: number; offsetY: number }
  | ({ type: 'fill_layer'; layerId: string; color: string } & Targeted)
  | ({ type: 'clear_layer'; layerId: string; rect?: Rect } & Targeted)
  | ({ type: 'draw_rect'; layerId: string; rect: Rect; radius: number; style: ShapeStyle } & Targeted)
  | ({ type: 'draw_ellipse'; layerId: string; center: Point; radiusX: number; radiusY: number; style: ShapeStyle } & Targeted)
  | ({ type: 'draw_path'; layerId: string; points: Point[]; closed: boolean; style: ShapeStyle } & Targeted)
  | ({
      type: 'brush_stroke';
      layerId: string;
      points: Point[];
      color: string;
      size: number;
      opacity: number;
      erase: boolean;
    } & Targeted)
  | ({
      type: 'draw_text';
      layerId: string;
      text: string;
      position: Point;
      size: number;
      color: string;
      font: string;
      weight: string;
      align: 'left' | 'center' | 'right';
    } & Targeted)
  | ({
      type: 'draw_gradient';
      layerId: string;
      kind: 'linear' | 'radial';
      from: Point;
      to: Point;
      stops: GradientStop[];
      rect?: Rect;
    } & Targeted)
  | ({ type: 'place_image'; layerId: string; src: string; rect: Rect } & Targeted)
  | ({ type: 'apply_filter'; layerId: string; filter: FilterName; amount: number; rect?: Rect } & Targeted)
  | ({
      type: 'transform_layer';
      layerId: string;
      dx: number;
      dy: number;
      scale: number;
      rotation: number;
      flipX: boolean;
      flipY: boolean;
    } & Targeted)
  | ({
      type: 'flood_fill';
      layerId: string;
      point: Point;
      color: string;
      tolerance: number;
      contiguous: boolean;
      /** Decide the region from the flattened image instead of this layer. */
      sampleAllLayers: boolean;
    } & Targeted)
  | { type: 'select_shape'; shape: SelectionShape; mode: SelectionMode; feather: number }
  | {
      type: 'select_color';
      point: Point;
      tolerance: number;
      contiguous: boolean;
      /** Layer to sample; undefined samples the flattened image. */
      layerId?: string;
      mode: SelectionMode;
    }
  | { type: 'select_layer_pixels'; layerId: string; mode: SelectionMode }
  | { type: 'selection_op'; op: 'all' | 'none' | 'invert' | 'feather'; amount?: number }
  | { type: 'copy_selection_to_layer'; layerId: string; newLayerId: string; cut: boolean }
  | { type: 'add_layer_mask'; layerId: string; from: 'reveal_all' | 'hide_all' | 'selection' }
  | { type: 'remove_layer_mask'; layerId: string; apply: boolean };

export type CommandType = Command['type'];

export type CommandOf<T extends CommandType> = Extract<Command, { type: T }>;
