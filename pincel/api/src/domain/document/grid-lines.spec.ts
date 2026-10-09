import { describe, expect, it } from 'vitest';
import { gridPositions, niceGridSpacing } from './grid-lines.js';

describe('grid lines', () => {
  it('picks a round spacing for the document size', () => {
    expect(niceGridSpacing(1024, 768)).toBe(200);
    expect(niceGridSpacing(300, 200)).toBe(50);
  });

  it('lists the lines inside a range, skipping the edges', () => {
    expect(gridPositions(0, 500, 100)).toEqual([100, 200, 300, 400]);
    expect(gridPositions(150, 420, 100)).toEqual([200, 300, 400]);
  });
});
