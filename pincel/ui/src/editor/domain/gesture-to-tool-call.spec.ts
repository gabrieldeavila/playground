import { describe, expect, it } from 'vitest';
import { simplifyPoints } from './drag-geometry';
import { clickToToolCall, gestureToToolCall } from './gesture-to-tool-call';
import type { ToolSettings } from './types';

const settings: ToolSettings = {
  primaryColor: '#111111',
  secondaryColor: '#eeeeee',
  size: 8,
  opacity: 1,
  fillShapes: true,
  strokeShapes: false,
  fontSize: 32,
  fontFamily: 'sans-serif',
  tolerance: 32,
  contiguous: true,
  sampleAllLayers: false,
  feather: 0,
  target: 'pixels',
};

describe('gestureToToolCall', () => {
  it('turns a reversed drag into a normalized rectangle', () => {
    expect(gestureToToolCall('rect', [[50, 40], [10, 0]], settings, 'layer_2')).toEqual({
      name: 'draw_rect',
      input: { layerId: 'layer_2', rect: { x: 10, y: 0, width: 40, height: 40 }, fill: '#111111', stroke: undefined, strokeWidth: 0 },
    });
  });

  it('turns a drag into an ellipse inside its bounding box', () => {
    const call = gestureToToolCall('ellipse', [[0, 0], [20, 10]], settings, 'l');
    expect(call?.input).toMatchObject({ center: [10, 5], radiusX: 10, radiusY: 5 });
  });

  it('turns a move drag into a layer offset', () => {
    expect(gestureToToolCall('move', [[10, 10], [15, 30]], settings, 'l')?.input).toEqual({ layerId: 'l', dx: 5, dy: 20 });
  });

  it('marks eraser strokes as erase', () => {
    expect(gestureToToolCall('eraser', [[1, 1]], settings, 'l')?.input).toMatchObject({ erase: true, points: [[1, 1]] });
  });

  it('ignores accidental tiny drags for shape tools', () => {
    expect(gestureToToolCall('rect', [[10, 10], [11, 10]], settings, 'l')).toBeNull();
  });

  it('flood-fills from the clicked point with the bucket', () => {
    expect(clickToToolCall('fill', [3, 4], settings, 'l')).toEqual({
      name: 'flood_fill',
      input: { layerId: 'l', point: [3, 4], color: '#111111', tolerance: 32, contiguous: true, sampleAllLayers: false },
    });
  });

  it('sends paint calls to the mask while editing it', () => {
    expect(gestureToToolCall('brush', [[1, 1]], { ...settings, target: 'mask' }, 'l')?.input).toMatchObject({ target: 'mask' });
  });
});

describe('selection gestures', () => {
  it('turns a marquee drag into select_rect with the modifier mode', () => {
    expect(gestureToToolCall('select-rect', [[10, 10], [0, 0]], settings, 'l', 'add')).toEqual({
      name: 'select_rect',
      input: { rect: { x: 0, y: 0, width: 10, height: 10 }, mode: 'add', feather: 0 },
    });
  });

  it('deselects on a plain marquee click, but not when adding', () => {
    expect(gestureToToolCall('select-rect', [[5, 5]], settings, 'l')?.input).toEqual({ action: 'deselect' });
    expect(gestureToToolCall('select-rect', [[5, 5]], settings, 'l', 'add')).toBeNull();
  });

  it('turns a lasso drag into an outline and never targets the mask', () => {
    const call = gestureToToolCall('lasso', [[0, 0], [20, 0], [20, 20], [0, 20]], { ...settings, target: 'mask' }, 'l');
    expect(call?.name).toBe('select_lasso');
    expect(call?.input).not.toHaveProperty('target');
  });

  it('samples only the active layer with the magic wand unless asked otherwise', () => {
    expect(clickToToolCall('magic-wand', [1, 2], settings, 'l')?.input).toMatchObject({ layerId: 'l', mode: 'replace' });
    expect(clickToToolCall('magic-wand', [1, 2], { ...settings, sampleAllLayers: true }, 'l')?.input).not.toHaveProperty('layerId');
  });
});

describe('simplifyPoints', () => {
  it('drops points that barely moved but keeps both ends', () => {
    expect(simplifyPoints([[0, 0], [0.5, 0], [1, 0], [5, 0], [5.2, 0]])).toEqual([[0, 0], [5, 0], [5.2, 0]]);
  });
});
