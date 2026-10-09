import { describe, expect, it } from 'vitest';
import { DocumentEngine } from './document-engine.js';
import { sampleColor } from './document-renderer.js';
import { napiPaintEnv } from './napi-paint-env.js';

const style = { fill: '#ff0000', strokeWidth: 0 };

async function engineWithShapesLayer() {
  const engine = new DocumentEngine(napiPaintEnv);
  await engine.reset({ width: 20, height: 20, background: '#ffffff' }, 'rest');
  await engine.execute({ type: 'add_layer', layerId: 'layer_2', name: 'Shapes', index: 1 }, 'rest');
  return engine;
}

describe('DocumentEngine', () => {
  it('draws on a layer and composites it over the background', async () => {
    const engine = await engineWithShapesLayer();
    await engine.execute(
      { type: 'draw_rect', layerId: 'layer_2', rect: { x: 0, y: 0, width: 10, height: 10 }, radius: 0, style },
      'mcp',
    );
    expect(sampleColor(engine.doc, 5, 5)).toBe('#ff0000');
    expect(sampleColor(engine.doc, 15, 15)).toBe('#ffffff');
    expect(engine.activeLayer).toBe('layer_2');
  });

  it('undo replays history without the last command, redo brings it back', async () => {
    const engine = await engineWithShapesLayer();
    await engine.execute({ type: 'fill_layer', layerId: 'layer_2', color: '#00ff00' }, 'ui');
    await engine.undo();
    expect(sampleColor(engine.doc, 1, 1)).toBe('#ffffff');
    await engine.redo();
    expect(sampleColor(engine.doc, 1, 1)).toBe('#00ff00');
  });

  it('respects layer opacity and visibility', async () => {
    const engine = await engineWithShapesLayer();
    await engine.execute({ type: 'fill_layer', layerId: 'layer_2', color: '#000000' }, 'ui');
    await engine.execute({ type: 'update_layer', layerId: 'layer_2', changes: { visible: false } }, 'ui');
    expect(sampleColor(engine.doc, 1, 1)).toBe('#ffffff');
    await engine.execute({ type: 'update_layer', layerId: 'layer_2', changes: { visible: true, opacity: 0.5 } }, 'ui');
    expect(sampleColor(engine.doc, 1, 1)).toMatch(/^#(7[e-f]|80){3}$/);
  });

  it('merges a layer down into the one below', async () => {
    const engine = await engineWithShapesLayer();
    await engine.execute({ type: 'fill_layer', layerId: 'layer_2', color: '#0000ff' }, 'ui');
    await engine.execute({ type: 'merge_down', layerId: 'layer_2' }, 'ui');
    expect(engine.doc.meta.layers.map((l) => l.id)).toEqual(['layer_1']);
    expect(sampleColor(engine.doc, 1, 1, 'layer_1')).toBe('#0000ff');
  });

  it('resizes the canvas with an offset', async () => {
    const engine = await engineWithShapesLayer();
    await engine.execute({ type: 'resize_canvas', width: 30, height: 30, offsetX: 10, offsetY: 10 }, 'ui');
    expect(engine.doc.meta.width).toBe(30);
    expect(sampleColor(engine.doc, 5, 5, 'layer_1')).toBe('#00000000');
    expect(sampleColor(engine.doc, 15, 15, 'layer_1')).toBe('#ffffff');
  });

  it('rejects edits on unknown layers and leaves history untouched', async () => {
    const engine = await engineWithShapesLayer();
    await expect(engine.execute({ type: 'fill_layer', layerId: 'nope', color: 'red' }, 'ui')).rejects.toThrow(
      'does not exist',
    );
    expect(engine.log).toHaveLength(1);
  });
});
