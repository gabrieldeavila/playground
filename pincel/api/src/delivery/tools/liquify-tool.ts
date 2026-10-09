import { z } from 'zod';
import { describeTarget, targetField } from './paint-target.js';
import { resolveLayer } from './resolve-layer.js';
import { defineTool } from './tool-definition.js';
import { layerIdField, pointField } from './tool-fields.js';

export const liquifyTool = defineTool({
  name: 'liquify',
  title: 'Liquify (push warp)',
  description:
    'Pushes image content: what is at `from` slides to `to`, fading out smoothly over `radius`. Subtle reshaping like Photoshop Liquify, e.g. lifting the corners of a mouth into a closed smile, or slimming a shape. Keep each push small (under a third of its radius) and prefer one wide push over several narrow ones: pushes on the same spot add up, and a large total move over a small radius bends lines into hooks. Zoom in with render_image region to check. Only moves existing pixels; it cannot invent new detail.',
  input: {
    layerId: layerIdField,
    strokes: z
      .array(z.object({ from: pointField, to: pointField, radius: z.number().positive().max(400) }))
      .min(1)
      .max(100),
    target: targetField,
  },
  async run({ layerId, strokes, target }, { engine, source }) {
    const id = resolveLayer(engine, layerId);
    await engine.execute({ type: 'liquify', layerId: id, strokes, target }, source);
    return { text: `Applied ${strokes.length} liquify push${strokes.length === 1 ? '' : 'es'} on ${describeTarget(engine, id, target)}` };
  },
});
