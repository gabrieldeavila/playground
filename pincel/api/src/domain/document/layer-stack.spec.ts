import { describe, expect, it } from 'vitest';
import { nextLayerId } from './layer-ids.js';
import { findLayer, insertLayer, moveLayer, newLayer, removeLayer, updateLayer } from './layer-stack.js';
import type { DocumentMeta } from './types.js';

const meta: DocumentMeta = {
  width: 10,
  height: 10,
  layers: [newLayer('layer_1', 'Background'), newLayer('layer_2', 'Shapes'), newLayer('layer_3', 'Text')],
};

const ids = (m: DocumentMeta) => m.layers.map((l) => l.id);

describe('layer stack', () => {
  it('generates the next id from the highest existing one', () => {
    expect(nextLayerId(meta)).toBe('layer_4');
    expect(nextLayerId({ ...meta, layers: [] })).toBe('layer_1');
  });

  it('inserts at a clamped index', () => {
    expect(ids(insertLayer(meta, newLayer('x', 'x'), 1))).toEqual(['layer_1', 'x', 'layer_2', 'layer_3']);
    expect(ids(insertLayer(meta, newLayer('x', 'x'), 99))).toEqual(['layer_1', 'layer_2', 'layer_3', 'x']);
  });

  it('moves a layer to a new index', () => {
    expect(ids(moveLayer(meta, 'layer_3', 0))).toEqual(['layer_3', 'layer_1', 'layer_2']);
  });

  it('removes and updates layers without mutating the input', () => {
    expect(ids(removeLayer(meta, 'layer_2'))).toEqual(['layer_1', 'layer_3']);
    expect(findLayer(updateLayer(meta, 'layer_2', { opacity: 0.5 }), 'layer_2').opacity).toBe(0.5);
    expect(findLayer(meta, 'layer_2').opacity).toBe(1);
  });

  it('throws for unknown layers', () => {
    expect(() => findLayer(meta, 'nope')).toThrow('Layer "nope" does not exist');
  });
});
