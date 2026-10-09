import { describe, expect, it } from 'vitest';
import { DocumentEngine } from './document-engine.js';
import { sampleColor } from './document-renderer.js';
import { napiPaintEnv } from './napi-paint-env.js';
import { selectionBounds } from './selection-renderer.js';

const rect = (x: number, y: number, width: number, height: number) => ({ kind: 'rect' as const, rect: { x, y, width, height } });

async function engineWithLayer() {
  const engine = new DocumentEngine(napiPaintEnv);
  await engine.reset({ width: 40, height: 40, background: '#ffffff' }, 'rest');
  await engine.execute({ type: 'add_layer', layerId: 'layer_2', name: 'Paint', index: 1 }, 'rest');
  return engine;
}

describe('selections', () => {
  it('limits painting to the selection', async () => {
    const engine = await engineWithLayer();
    await engine.execute({ type: 'select_shape', shape: rect(0, 0, 20, 40), mode: 'replace', feather: 0 }, 'rest');
    await engine.execute({ type: 'fill_layer', layerId: 'layer_2', color: '#ff0000' }, 'rest');
    expect(sampleColor(engine.doc, 5, 5)).toBe('#ff0000');
    expect(sampleColor(engine.doc, 30, 5)).toBe('#ffffff');
  });

  it('combines selections with add, subtract and intersect', async () => {
    const engine = await engineWithLayer();
    await engine.execute({ type: 'select_shape', shape: rect(0, 0, 20, 20), mode: 'replace', feather: 0 }, 'rest');
    await engine.execute({ type: 'select_shape', shape: rect(20, 0, 20, 20), mode: 'add', feather: 0 }, 'rest');
    expect(selectionBounds(engine.doc)).toEqual({ x: 0, y: 0, width: 40, height: 20 });
    await engine.execute({ type: 'select_shape', shape: rect(0, 0, 10, 20), mode: 'subtract', feather: 0 }, 'rest');
    expect(selectionBounds(engine.doc)).toEqual({ x: 10, y: 0, width: 30, height: 20 });
    await engine.execute({ type: 'select_shape', shape: rect(0, 0, 15, 40), mode: 'intersect', feather: 0 }, 'rest');
    expect(selectionBounds(engine.doc)).toEqual({ x: 10, y: 0, width: 5, height: 20 });
  });

  it('inverts and clears the selection, and undo brings it back', async () => {
    const engine = await engineWithLayer();
    await engine.execute({ type: 'select_shape', shape: rect(0, 0, 10, 40), mode: 'replace', feather: 0 }, 'rest');
    await engine.execute({ type: 'selection_op', op: 'invert' }, 'rest');
    expect(selectionBounds(engine.doc)).toEqual({ x: 10, y: 0, width: 30, height: 40 });
    await engine.execute({ type: 'selection_op', op: 'none' }, 'rest');
    expect(engine.doc.selection).toBeNull();
    await engine.undo();
    expect(selectionBounds(engine.doc)).toEqual({ x: 10, y: 0, width: 30, height: 40 });
  });

  it('feathering makes a soft edge', async () => {
    const engine = await engineWithLayer();
    await engine.execute({ type: 'select_shape', shape: rect(0, 0, 20, 40), mode: 'replace', feather: 4 }, 'rest');
    await engine.execute({ type: 'fill_layer', layerId: 'layer_2', color: '#000000' }, 'rest');
    const [r] = hexToRgb(sampleColor(engine.doc, 20, 20));
    expect(r).toBeGreaterThan(40);
    expect(r).toBeLessThan(220);
  });

  it('magic wand selects similar color and layer-via-cut moves it to a new layer', async () => {
    const engine = await engineWithLayer();
    await engine.execute({ type: 'draw_rect', layerId: 'layer_2', rect: { x: 5, y: 5, width: 10, height: 10 }, radius: 0, style: { fill: '#00ff00', strokeWidth: 0 } }, 'rest');
    await engine.execute({ type: 'select_color', point: [8, 8], tolerance: 10, contiguous: true, layerId: 'layer_2', mode: 'replace' }, 'rest');
    expect(selectionBounds(engine.doc)).toEqual({ x: 5, y: 5, width: 10, height: 10 });
    await engine.execute({ type: 'copy_selection_to_layer', layerId: 'layer_2', newLayerId: 'layer_3', cut: true }, 'rest');
    expect(engine.activeLayer).toBe('layer_3');
    expect(sampleColor(engine.doc, 8, 8, 'layer_3')).toBe('#00ff00');
    expect(sampleColor(engine.doc, 8, 8, 'layer_2')).toBe('#00000000');
  });

  it('moving with a selection moves only the selected pixels, and the selection follows', async () => {
    const engine = await engineWithLayer();
    await engine.execute({ type: 'fill_layer', layerId: 'layer_2', color: '#0000ff' }, 'rest');
    await engine.execute({ type: 'select_shape', shape: rect(0, 0, 10, 10), mode: 'replace', feather: 0 }, 'rest');
    await engine.execute({ type: 'transform_layer', layerId: 'layer_2', dx: 20, dy: 0, scale: 1, rotation: 0, flipX: false, flipY: false }, 'rest');
    expect(sampleColor(engine.doc, 5, 5)).toBe('#ffffff');
    expect(sampleColor(engine.doc, 25, 5)).toBe('#0000ff');
    expect(sampleColor(engine.doc, 5, 25)).toBe('#0000ff');
    expect(selectionBounds(engine.doc)).toEqual({ x: 20, y: 0, width: 10, height: 10 });
  });
});

describe('paint bucket', () => {
  it('fills only the contiguous similar area', async () => {
    const engine = await engineWithLayer();
    await engine.execute({ type: 'draw_path', layerId: 'layer_1', points: [[20, 0], [20, 40]], closed: false, style: { stroke: '#000000', strokeWidth: 2 } }, 'rest');
    await engine.execute({ type: 'flood_fill', layerId: 'layer_1', point: [5, 5], color: '#ff0000', tolerance: 16, contiguous: true, sampleAllLayers: false }, 'rest');
    expect(sampleColor(engine.doc, 5, 5)).toBe('#ff0000');
    expect(sampleColor(engine.doc, 35, 5)).toBe('#ffffff');
  });
});

describe('layer masks', () => {
  it('hides the layer where the mask is black and reveals where painted white', async () => {
    const engine = await engineWithLayer();
    await engine.execute({ type: 'fill_layer', layerId: 'layer_2', color: '#ff0000' }, 'rest');
    await engine.execute({ type: 'add_layer_mask', layerId: 'layer_2', from: 'hide_all' }, 'rest');
    expect(sampleColor(engine.doc, 5, 5)).toBe('#ffffff');
    await engine.execute({ type: 'draw_rect', layerId: 'layer_2', target: 'mask', rect: { x: 0, y: 0, width: 10, height: 10 }, radius: 0, style: { fill: '#ffffff', strokeWidth: 0 } }, 'rest');
    expect(sampleColor(engine.doc, 5, 5)).toBe('#ff0000');
    expect(sampleColor(engine.doc, 30, 30)).toBe('#ffffff');
  });

  it('creates a mask from the selection, can disable it, and apply bakes it in', async () => {
    const engine = await engineWithLayer();
    await engine.execute({ type: 'fill_layer', layerId: 'layer_2', color: '#ff0000' }, 'rest');
    await engine.execute({ type: 'select_shape', shape: rect(0, 0, 20, 40), mode: 'replace', feather: 0 }, 'rest');
    await engine.execute({ type: 'add_layer_mask', layerId: 'layer_2', from: 'selection' }, 'rest');
    await engine.execute({ type: 'selection_op', op: 'none' }, 'rest');
    expect(sampleColor(engine.doc, 30, 5)).toBe('#ffffff');
    await engine.execute({ type: 'update_layer', layerId: 'layer_2', changes: { maskEnabled: false } }, 'rest');
    expect(sampleColor(engine.doc, 30, 5)).toBe('#ff0000');
    await engine.execute({ type: 'update_layer', layerId: 'layer_2', changes: { maskEnabled: true } }, 'rest');
    await engine.execute({ type: 'remove_layer_mask', layerId: 'layer_2', apply: true }, 'rest');
    expect(engine.doc.meta.layers[1].mask).toBeNull();
    expect(sampleColor(engine.doc, 30, 5, 'layer_2')).toBe('#00000000');
    expect(sampleColor(engine.doc, 5, 5, 'layer_2')).toBe('#ff0000');
  });

  it('moves the mask together with the layer and copies it on duplicate', async () => {
    const engine = await engineWithLayer();
    await engine.execute({ type: 'fill_layer', layerId: 'layer_2', color: '#ff0000' }, 'rest');
    await engine.execute({ type: 'add_layer_mask', layerId: 'layer_2', from: 'hide_all' }, 'rest');
    await engine.execute({ type: 'fill_layer', layerId: 'layer_2', target: 'mask', color: '#ffffff' }, 'rest');
    await engine.execute({ type: 'clear_layer', layerId: 'layer_2', target: 'mask', rect: { x: 0, y: 0, width: 10, height: 40 } }, 'rest');
    await engine.execute({ type: 'duplicate_layer', layerId: 'layer_2', newLayerId: 'layer_3' }, 'rest');
    expect(engine.doc.meta.layers[2].mask).toEqual({ enabled: true });
    await engine.execute({ type: 'delete_layer', layerId: 'layer_3' }, 'rest');
    expect(sampleColor(engine.doc, 5, 5)).toBe('#ffffff');
    expect(sampleColor(engine.doc, 15, 5)).toBe('#ff0000');
  });

  it('selecting a layer\'s pixels respects its mask', async () => {
    const engine = await engineWithLayer();
    await engine.execute({ type: 'fill_layer', layerId: 'layer_2', color: '#ff0000' }, 'rest');
    await engine.execute({ type: 'select_shape', shape: rect(0, 0, 10, 10), mode: 'replace', feather: 0 }, 'rest');
    await engine.execute({ type: 'add_layer_mask', layerId: 'layer_2', from: 'selection' }, 'rest');
    await engine.execute({ type: 'select_layer_pixels', layerId: 'layer_2', mode: 'replace' }, 'rest');
    expect(selectionBounds(engine.doc)).toEqual({ x: 0, y: 0, width: 10, height: 10 });
  });

  it('refuses to paint on a mask that does not exist', async () => {
    const engine = await engineWithLayer();
    await expect(engine.execute({ type: 'fill_layer', layerId: 'layer_2', target: 'mask', color: '#fff' }, 'rest')).rejects.toThrow('has no mask');
  });
});

function hexToRgb(hex: string): number[] {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
}
