import { describe, expect, it } from 'vitest';
import { fitZoom, toCanvasPoint } from './canvas-coords';

describe('toCanvasPoint', () => {
  it('maps a pointer on a half-size display back to document pixels', () => {
    const box = { left: 100, top: 50, width: 400, height: 300 };
    expect(toCanvasPoint(300, 200, box, { width: 800, height: 600 })).toEqual([400, 300]);
  });
});

describe('fitZoom', () => {
  it('shrinks big documents to fit and never zooms past 100%', () => {
    expect(fitZoom({ width: 2000, height: 1000 }, { width: 1048, height: 2000 })).toBe(0.5);
    expect(fitZoom({ width: 100, height: 100 }, { width: 1000, height: 1000 })).toBe(1);
  });
});
