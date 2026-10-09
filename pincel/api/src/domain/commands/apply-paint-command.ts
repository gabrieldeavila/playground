import { findLayer } from '../document/layer-stack.js';
import { applyFilter } from '../paint/apply-filter.js';
import { applyTransform } from '../paint/apply-transform.js';
import { brushStroke } from '../paint/brush-stroke.js';
import { paintInsideSelection } from '../paint/clip-to-selection.js';
import { drawGradient } from '../paint/draw-gradient.js';
import { drawEllipse, drawPath, drawRect } from '../paint/draw-shapes.js';
import { drawText } from '../paint/draw-text.js';
import { clearLayer, fillLayer } from '../paint/fill-and-clear.js';
import { floodFill } from '../paint/flood-fill.js';
import { placeImage } from '../paint/place-image.js';
import { renderComposite } from '../paint/render-composite.js';
import { flattenOnBlack, grayToAlpha } from '../paint/surface-ops.js';
import type { PaintEnv, Surface } from '../paint/surface.js';
import type { CommandOf } from './command-types.js';
import { maskOf, surfaceOf, type DocState } from './doc-state.js';

export type PaintCommand = CommandOf<
  | 'fill_layer'
  | 'clear_layer'
  | 'draw_rect'
  | 'draw_ellipse'
  | 'draw_path'
  | 'brush_stroke'
  | 'draw_text'
  | 'draw_gradient'
  | 'place_image'
  | 'apply_filter'
  | 'transform_layer'
  | 'flood_fill'
>;

/**
 * Paints into a layer's pixels or its mask. With an active selection, only the
 * selected area changes. The layer list itself doesn't change.
 */
export async function applyPaintCommand(state: DocState, cmd: PaintCommand, env: PaintEnv): Promise<DocState> {
  findLayer(state.meta, cmd.layerId);
  if (cmd.type === 'transform_layer') {
    applyTransform(state, cmd, env);
    return state;
  }
  const onMask = cmd.target === 'mask';
  const surface = onMask ? maskOf(state, cmd.layerId) : surfaceOf(state, cmd.layerId);
  const paint = () => paintOnto(surface, cmd, state, env);
  if (state.selection) await paintInsideSelection(surface, grayToAlpha(state.selection, env), paint, env);
  else await paint();
  // Erasing or clearing a mask hides; keep masks opaque grayscale.
  if (onMask) flattenOnBlack(surface);
  return state;
}

async function paintOnto(surface: Surface, cmd: Exclude<PaintCommand, { type: 'transform_layer' }>, state: DocState, env: PaintEnv) {
  const ctx = surface.getContext('2d');
  ctx.save();
  try {
    switch (cmd.type) {
      case 'fill_layer':
        return fillLayer(ctx, cmd);
      case 'clear_layer':
        return clearLayer(ctx, cmd);
      case 'draw_rect':
        return drawRect(ctx, cmd);
      case 'draw_ellipse':
        return drawEllipse(ctx, cmd);
      case 'draw_path':
        return drawPath(ctx, cmd);
      case 'brush_stroke':
        return brushStroke(ctx, cmd);
      case 'draw_text':
        return drawText(ctx, cmd);
      case 'draw_gradient':
        return drawGradient(ctx, cmd);
      case 'place_image':
        return await placeImage(ctx, cmd, env);
      case 'apply_filter':
        return applyFilter(ctx, cmd);
      case 'flood_fill':
        return floodFill(surface, cmd.sampleAllLayers ? renderComposite(state, env) : surface, cmd, env);
    }
  } finally {
    ctx.restore();
  }
}
