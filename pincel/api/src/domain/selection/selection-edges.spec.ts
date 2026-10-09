import { describe, expect, it } from 'vitest';
import { coverageToGray } from './mask-alpha.js';
import { selectionEdges } from './selection-edges.js';

describe('selectionEdges', () => {
  it('marks the outline of a selected block but not its interior', () => {
    const coverage = new Uint8Array(25);
    for (let y = 1; y <= 3; y++) for (let x = 1; x <= 3; x++) coverage[y * 5 + x] = 255;
    const edges = selectionEdges(coverageToGray(coverage, 5, 5));
    expect(edges[2 * 5 + 2]).toBe(0);
    expect(edges[1 * 5 + 1]).toBe(1);
    expect(edges[0]).toBe(0);
    expect(Array.from(edges).filter(Boolean)).toHaveLength(8);
  });
});
